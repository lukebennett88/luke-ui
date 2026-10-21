/**
 * Runs `vp pack --watch` with `themePackage` on a minimal theme package outside the repository, and
 * checks input and compiler edits both reach the stylesheet. Node caches imported modules by URL,
 * so each rebuild must load the current modules.
 */

import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { afterAll, beforeAll, expect, onTestFailed, test } from 'vite-plus/test';

const packageDir = fileURLToPath(new URL('.', import.meta.url));
const RADIUS_PATTERN = /--luke-radius-control:\s*([^;]+);/;

let fixture: string;
let watcher: ChildProcess | undefined;
let watchOutput = '';

/** The theme input, with `radius.control` in pixels, so each edit changes one token. */
function inputSource(radius: number): string {
	return `import type { ThemeInput } from '@luke-ui/react/theme/compiler';
import { THEME_NAME } from './name.js';

export const theme: ThemeInput = {
	color: { accent: '#3b82f6' },
	name: THEME_NAME,
	radius: { control: ${radius} },
	typography: {
		fonts: {
			body: {
				family: "'Inter', system-ui, sans-serif",
				metrics: { ascent: 1984, capHeight: 1490, descent: -494, familyName: 'Inter', lineGap: 0, unitsPerEm: 2048 },
			},
		},
	},
};
`;
}

beforeAll(async () => {
	fixture = await mkdtemp(path.join(tmpdir(), 'luke-ui-theme-watch-'));
	await mkdir(path.join(fixture, 'src'));
	await mkdir(path.join(fixture, 'node_modules/@luke-ui/react'), { recursive: true });
	await mkdir(path.join(fixture, 'node_modules/@fontsource-variable'), { recursive: true });
	await mkdir(path.join(fixture, 'node_modules/@types'), { recursive: true });
	await symlink(
		path.join(packageDir, 'node_modules/@types/node'),
		path.join(fixture, 'node_modules/@types/node'),
		'dir',
	);
	await symlink(
		path.join(packageDir, 'node_modules/vite-plus'),
		path.join(fixture, 'node_modules/vite-plus'),
		'dir',
	);
	await symlink(
		path.join(packageDir, 'node_modules/@fontsource-variable/inter'),
		path.join(fixture, 'node_modules/@fontsource-variable/inter'),
		'dir',
	);
	const react = path.resolve(packageDir, '../react');
	await cp(path.join(react, 'dist'), path.join(fixture, 'node_modules/@luke-ui/react/dist'), {
		recursive: true,
	});
	await cp(
		path.join(react, 'package.json'),
		path.join(fixture, 'node_modules/@luke-ui/react/package.json'),
	);
	await symlink(
		path.join(react, 'node_modules'),
		path.join(fixture, 'node_modules/@luke-ui/react/node_modules'),
		'dir',
	);
	const files = {
		'fonts.css': readFileSync(path.join(packageDir, 'fonts.css'), 'utf8'),
		'theme-package.ts': readFileSync(path.join(packageDir, 'theme-package.ts'), 'utf8'),
		'package.json': JSON.stringify({
			name: 'theme-watch-fixture',
			peerDependencies: { '@luke-ui/react': '*' },
			private: true,
			type: 'module',
			// `vp pack` runs `npm pack`, which rejects a package with no version. That failure can
			// leave `stylesheet.css` built from the previous input.
			version: '0.0.0',
		}),
		'src/index.ts': `import { getThemeClassName } from '@luke-ui/react/theme';
import { THEME_NAME } from './name.js';

export const themeClassName: string = getThemeClassName(THEME_NAME);
`,
		'src/input.ts': inputSource(4),
		'src/name.ts': "export const THEME_NAME = 'watch-fixture';\n",
		'tsconfig.json': readFileSync(path.join(packageDir, 'tsconfig.json'), 'utf8').replace(
			'"include": ["*.ts"]',
			'"include": ["src/**/*.ts", "vite.config.ts"]',
		),
		'vite.config.ts': `import { defineConfig } from 'vite-plus';
import { themePackage } from './theme-package.js';

export default defineConfig(themePackage);
`,
	};
	await Promise.all(
		Object.entries(files).map(([name, source]) => writeFile(path.join(fixture, name), source)),
	);

	watcher = spawn(path.join(packageDir, 'node_modules', '.bin', 'vp'), ['pack', '--watch'], {
		cwd: fixture,
		// Its own process group, so cleanup stops every process the watcher starts.
		detached: true,
		stdio: ['ignore', 'pipe', 'pipe'],
	});
	watcher.stdout?.on('data', (chunk: Buffer) => (watchOutput += chunk));
	watcher.stderr?.on('data', (chunk: Buffer) => (watchOutput += chunk));
});

afterAll(async () => {
	if (watcher?.pid !== undefined && watcher.exitCode === null) {
		const exited = new Promise((resolve) => watcher?.once('exit', resolve));
		process.kill(-watcher.pid, 'SIGTERM');
		await exited;
	}
	if (fixture !== undefined) await rm(fixture, { force: true, recursive: true });
});

/** The control radius the stylesheet declares, or `undefined` before the first build writes it. */
function stylesheetRadius(): string | undefined {
	try {
		return RADIUS_PATTERN.exec(
			readFileSync(path.join(fixture, 'dist', 'stylesheet.css'), 'utf8'),
		)?.[1];
	} catch {
		return undefined;
	}
}

/** Each wait covers one rebuild, which takes a few seconds even on a slow runner. */
const REBUILD = { interval: 100, timeout: 60_000 };

test(
	'rewrites the stylesheet for input and compiler edits without changing normalized exports',
	{ timeout: 180_000 },
	async () => {
		onTestFailed(() => {
			process.stderr.write(`vp pack --watch output:\n${watchOutput}\n`);
		});

		await expect.poll(stylesheetRadius, { ...REBUILD, message: 'initial build' }).toBe('0.25rem');
		await expect
			.poll(
				() => JSON.parse(readFileSync(path.join(fixture, 'package.json'), 'utf8')).exports,
				REBUILD,
			)
			.toEqual({
				'.': './dist/index.js',
				'./input': './dist/input.js',
				'./package.json': './package.json',
				'./fonts.css': './dist/fonts.css',
				'./stylesheet.css': './dist/stylesheet.css',
			});
		const manifest = readFileSync(path.join(fixture, 'package.json'), 'utf8');

		await writeFile(path.join(fixture, 'src', 'input.ts'), inputSource(7));
		await expect.poll(stylesheetRadius, { ...REBUILD, message: 'first rebuild' }).toBe('0.4375rem');

		await writeFile(path.join(fixture, 'src', 'input.ts'), inputSource(11));
		await expect
			.poll(stylesheetRadius, { ...REBUILD, message: 'second rebuild' })
			.toBe('0.6875rem');
		const compiler = path.join(fixture, 'node_modules/@luke-ui/react/dist/theme/compiler.js');
		await cp(compiler, path.join(path.dirname(compiler), 'compiler-original.js'));
		const compilerSource = (version: number) => String.raw`export * from './compiler-original.js';
import { defineTheme as original } from './compiler-original.js';
export const defineTheme = (input) => original(input) + '\n:root { --compiler-probe: ${version}; }';
`;
		await writeFile(compiler, compilerSource(1));
		await expect
			.poll(() => readFileSync(path.join(fixture, 'dist/stylesheet.css'), 'utf8'), REBUILD)
			.toContain('--compiler-probe: 1;');
		await writeFile(compiler, compilerSource(2));
		await expect
			.poll(() => readFileSync(path.join(fixture, 'dist/stylesheet.css'), 'utf8'), REBUILD)
			.toContain('--compiler-probe: 2;');
		expect(readFileSync(path.join(fixture, 'package.json'), 'utf8')).toBe(manifest);
	},
);

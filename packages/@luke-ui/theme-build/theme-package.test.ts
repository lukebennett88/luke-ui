/**
 * Runs `vp pack --watch` with `themePackage` on a minimal theme package outside the repository, and
 * checks every rebuild writes the stylesheet from that build's input. Node caches an imported module
 * by URL, so a plugin that imported `dist/input.js` by one URL would keep compiling the first input.
 */

import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
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
	// The fixture resolves `vite-plus`, `@luke-ui/react`, and the font through this package's
	// dependencies, as Paper and Tactile resolve them through theirs.
	await symlink(path.join(packageDir, 'node_modules'), path.join(fixture, 'node_modules'), 'dir');
	const files = {
		'package.json': JSON.stringify({
			name: 'theme-watch-fixture',
			peerDependencies: { '@luke-ui/react': '*' },
			private: true,
			type: 'module',
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
import { themePackage } from ${JSON.stringify(pathToFileURL(path.join(packageDir, 'theme-package.ts')).href)};

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
	'rewrites the stylesheet from the new input on every watch rebuild',
	{ timeout: 180_000 },
	async () => {
		onTestFailed(() => {
			process.stderr.write(`vp pack --watch output:\n${watchOutput}\n`);
		});

		await expect.poll(stylesheetRadius, { ...REBUILD, message: 'initial build' }).toBe('0.25rem');

		await writeFile(path.join(fixture, 'src', 'input.ts'), inputSource(7));
		await expect.poll(stylesheetRadius, { ...REBUILD, message: 'first rebuild' }).toBe('0.4375rem');

		await writeFile(path.join(fixture, 'src', 'input.ts'), inputSource(11));
		await expect
			.poll(stylesheetRadius, { ...REBUILD, message: 'second rebuild' })
			.toBe('0.6875rem');
	},
);

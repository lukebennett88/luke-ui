import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { build } from 'vite-plus';
import type { Plugin } from 'vite-plus';
import { afterEach, expect, test } from 'vite-plus/test';
import { stylexPlugin } from './stylex-plugin.js';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const temporaryDirectories = new Set<string>();

afterEach(async () => {
	await Promise.all(
		[...temporaryDirectories].map((directory) => rm(directory, { force: true, recursive: true })),
	);
	temporaryDirectories.clear();
});

test('extracts StyleX and keeps cached rules current across watch rebuilds', async () => {
	const fixtureRoot = await createFixture({
		'entry.ts': "import './stable.js';\nimport './changing.js';",
		'stable.ts': stylexModule('color', 'red'),
		'changing.ts': stylexModule('backgroundColor', 'blue'),
	});
	const outDir = path.join(fixtureRoot, 'dist');
	const watcher = await watchFixture(fixtureRoot, outDir);

	try {
		await nextBundle(watcher);
		const initialStylesheet = await readFile(path.join(outDir, 'stylesheet.css'), 'utf8');
		expect(initialStylesheet).toContain('color:red');
		expect(initialStylesheet).toContain('background-color:blue');

		const rebuilt = nextBundle(watcher);
		await writeFile(
			path.join(fixtureRoot, 'changing.ts'),
			stylexModule('backgroundColor', 'green'),
		);
		await rebuilt;

		const rebuiltStylesheet = await readFile(path.join(outDir, 'stylesheet.css'), 'utf8');
		expect(rebuiltStylesheet).toContain('color:red');
		expect(rebuiltStylesheet).not.toContain('background-color:blue');
		expect(rebuiltStylesheet).toContain('background-color:green');

		const javascript = await readFile(path.join(outDir, 'entry.js'), 'utf8');
		expect(javascript).not.toContain('stylex.create');
		expect(javascript).not.toContain('@stylexjs/stylex');
		expect(() => execFileSync(process.execPath, [path.join(outDir, 'entry.js')])).not.toThrow();
	} finally {
		await watcher.close();
	}
});

test('fails when a StyleX declaration cannot be statically extracted', async () => {
	const fixtureRoot = await createFixture({
		'entry.ts': [
			"import * as stylex from '@stylexjs/stylex';",
			"const color = process.env.COLOR ?? 'red';",
			'export const styles = stylex.create({ root: { color } });',
		].join('\n'),
	});

	await expect(buildFixture(fixtureRoot, path.join(fixtureRoot, 'dist'))).rejects.toThrow(
		'Referenced constant is not defined.',
	);
});

async function createFixture(files: Record<string, string>) {
	const fixtureRoot = await mkdtemp(path.join(packageRoot, '.stylex-plugin-test-'));
	temporaryDirectories.add(fixtureRoot);
	await Promise.all(
		Object.entries(files).map(([filename, source]) =>
			writeFile(path.join(fixtureRoot, filename), source),
		),
	);
	return fixtureRoot;
}

function stylexModule(property: 'backgroundColor' | 'color', value: string) {
	return [
		"import * as stylex from '@stylexjs/stylex';",
		`export const styles = stylex.create({ root: { ${property}: '${value}' } });`,
	].join('\n');
}

async function watchFixture(fixtureRoot: string, outDir: string) {
	const result = await buildFixture(fixtureRoot, outDir, { buildDelay: 20 });
	if (!('on' in result)) throw new Error('Expected Vite Plus to return a watcher.');
	return result;
}

function buildFixture(fixtureRoot: string, outDir: string, watch?: { buildDelay: number }) {
	return build({
		build: {
			emptyOutDir: true,
			outDir,
			rollupOptions: {
				input: path.join(fixtureRoot, 'entry.ts'),
				output: { entryFileNames: 'entry.js' },
			},
			watch,
		},
		configFile: false,
		logLevel: 'silent',
		plugins: [stylesheetAssetPlugin(), stylexPlugin(packageRoot)],
		root: fixtureRoot,
	});
}

function stylesheetAssetPlugin(): Plugin {
	return {
		name: 'stylesheet-asset',
		buildStart() {
			this.emitFile({ fileName: 'stylesheet.css', source: '/* base */', type: 'asset' });
		},
	};
}

function nextBundle(watcher: Awaited<ReturnType<typeof watchFixture>>) {
	return new Promise<void>((resolve, reject) => {
		watcher.on('event', (event) => {
			if (event.code === 'BUNDLE_END') {
				resolve();
			} else if (event.code === 'ERROR') {
				reject(event.error);
			}
		});
	});
}

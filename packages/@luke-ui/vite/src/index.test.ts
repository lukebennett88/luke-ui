import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { build, createServer } from 'vite';
import type { InlineConfig, ViteDevServer } from 'vite';
import { expect, test } from 'vite-plus/test';
import packageJson from '../package.json' with { type: 'json' };
import { lukeUi, STYLESHEET_IMPORT } from './index.js';

const require = createRequire(import.meta.url);
const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = path.resolve(packageRoot, '../../..');

const INITIAL_COLOR = 'rgb(11,22,33)';
const UPDATED_COLOR = 'rgb(44,55,66)';
const ADDED_COLOR = 'rgb(77,88,99)';
const LAYER_ORDER = '@layer reset, theme, base, recipes, xstyle, components, utilities;';
const LAYER_ORDER_PATTERN =
	/@layer reset,\s*theme,\s*base,\s*recipes,\s*xstyle\.priority\d+(?:,\s*xstyle\.priority\d+)*,\s*components,\s*utilities;/;

const FIXTURE_TIMEOUT_MS = 60_000;

test('exports lukeUi and the public stylesheet subpath', () => {
	expect(typeof lukeUi).toBe('function');
	expect(packageJson.exports['.']).toBe('./dist/index.mjs');
	expect(packageJson.exports['./stylesheet.css']).toBe('./dist/stylesheet.css');
	expect(STYLESHEET_IMPORT).toBe('@luke-ui/vite/stylesheet.css');
});

test('owns the Babel compiler dependencies consumers must not install', () => {
	expect(packageJson.dependencies['@babel/core']).toBe('catalog:');
	expect(packageJson.dependencies['@stylexjs/babel-plugin']).toBe('catalog:');
	expect(packageJson.peerDependencies.vite).toBe('catalog:publish');
	expect(packageJson.peerDependencies['@stylexjs/stylex']).toBe('catalog:');
	expect(packageJson.peerDependencies.vite).not.toContain('voidzero');
});

test('hosted Installation docs do not ask consumers to install Babel packages', async () => {
	const installation = await readFile(
		path.join(repoRoot, 'apps/docs/content/docs/docs/installation.mdx'),
		'utf8',
	);
	expect(installation).toContain('pnpm add -D @luke-ui/vite');
	expect(installation).not.toContain('@babel/core');
	expect(installation).not.toContain('@stylexjs/babel-plugin');
});

test('hosted Styling docs no longer publish a copy-paste Vite plugin', async () => {
	const styling = await readFile(
		path.join(repoRoot, 'apps/docs/content/docs/docs/styling.mdx'),
		'utf8',
	);
	expect(styling).not.toContain('virtual:stylex.css');
	expect(styling).not.toContain('transformAsync');
	expect(styling).not.toContain('processStylexRules');
	expect(styling).not.toContain('generateBundle');
	expect(styling).not.toContain('useLayers');
	expect(styling).not.toContain('hotUpdate');
	expect(styling).toContain('@luke-ui/vite');
});

test(
	'vite build emits application StyleX rules into the xstyle layer',
	{ timeout: FIXTURE_TIMEOUT_MS },
	async () => {
		const fixture = await createConsumerViteFixture(INITIAL_COLOR);
		try {
			const result = await build(viteConfig(fixture.fixtureDir, { command: 'build' }));
			const css = cssFromBuild(result);
			expect(css).toContain(LAYER_ORDER);
			expectDocumentedStylexCss(css, INITIAL_COLOR);
			expect(css).not.toContain('.stylex-placeholder');
		} finally {
			await fixture.cleanup();
		}
	},
);

test(
	'the public stylesheet import works through a Vite production build',
	{ timeout: FIXTURE_TIMEOUT_MS },
	async () => {
		const fixture = await createConsumerViteFixture(INITIAL_COLOR);
		try {
			const result = await build(viteConfig(fixture.fixtureDir, { command: 'build' }));
			const css = cssFromBuild(result);
			expect(css.startsWith(LAYER_ORDER) || css.includes(LAYER_ORDER)).toBe(true);
			expect(css).toContain('@layer xstyle.priority');
		} finally {
			await fixture.cleanup();
		}
	},
);

test(
	'a Vite dev server serves a complete StyleX stylesheet and updates it when rules change',
	{ timeout: FIXTURE_TIMEOUT_MS },
	async () => {
		const fixture = await createConsumerViteFixture(INITIAL_COLOR);
		let server: ViteDevServer | undefined;
		try {
			server = await createServer(viteConfig(fixture.fixtureDir, { command: 'serve' }));
			const environment = server.environments.client;

			const initialCss = await readStylesheetCss(server);
			expect(initialCss).toContain(LAYER_ORDER);
			expectDocumentedStylexCss(initialCss, INITIAL_COLOR);
			expect(await readStylesheetModule(server)).toContain(INITIAL_COLOR);
			expect(moduleIds(environment).some((id) => id.includes('styles.ts'))).toBe(false);

			await writeFile(fixture.stylesPath, stylesSource(UPDATED_COLOR), 'utf8');
			server.watcher.emit('change', fixture.stylesPath);
			await expect
				.poll(() => readStylesheetModule(server!), { timeout: 8_000 })
				.toEqual(expect.stringContaining(UPDATED_COLOR));
			const updatedCss = await readStylesheetCss(server);
			expect(updatedCss).not.toContain(INITIAL_COLOR);
			expectDocumentedStylexCss(updatedCss, UPDATED_COLOR);

			await writeFile(
				fixture.stylesPath,
				`import * as stylex from '@stylexjs/stylex';
export const styles = stylex.create({
	box: { color: '${UPDATED_COLOR}' },
	extra: { backgroundColor: '${ADDED_COLOR}' },
});
`,
				'utf8',
			);
			server.watcher.emit('change', fixture.stylesPath);
			await expect
				.poll(() => readStylesheetModule(server!), { timeout: 8_000 })
				.toEqual(expect.stringContaining(ADDED_COLOR));
			const addedCss = await readStylesheetCss(server);
			expect(addedCss).toContain(UPDATED_COLOR);
			expect(addedCss).toContain(ADDED_COLOR);

			await writeFile(fixture.stylesPath, 'export const unused = 1;\n', 'utf8');
			server.watcher.emit('change', fixture.stylesPath);
			await expect
				.poll(async () => (await readStylesheetModule(server!)).includes(UPDATED_COLOR), {
					timeout: 8_000,
				})
				.toBe(false);
			const clearedCss = await readStylesheetCss(server);
			expect(clearedCss).toContain(LAYER_ORDER);
			expect(clearedCss).not.toContain(UPDATED_COLOR);
			expect(clearedCss).not.toContain(ADDED_COLOR);
		} finally {
			await server?.close();
			await fixture.cleanup();
		}
	},
);

function viteConfig(root: string, options: { command: 'build' | 'serve' }): InlineConfig {
	return {
		build: {
			cssMinify: false,
			minify: false,
			write: false,
		},
		configFile: false,
		logLevel: 'silent',
		optimizeDeps: {
			include: [],
			noDiscovery: true,
		},
		plugins: [lukeUi()],
		root,
		server:
			options.command === 'serve'
				? {
						middlewareMode: true,
						preTransformRequests: false,
						watch: { usePolling: true, interval: 50 },
					}
				: undefined,
	};
}

function stylesSource(color: string): string {
	return `import * as stylex from '@stylexjs/stylex';
export const styles = stylex.create({
	box: { color: '${color}' },
});
`;
}

function expectDocumentedStylexCss(css: string, color: string): void {
	expect(css).toMatch(LAYER_ORDER_PATTERN);
	expect(css).toContain(color);
	expect(css).toContain('@layer xstyle.priority');
}

function moduleIds(environment: ViteDevServer['environments']['client']): Array<string> {
	return [...environment.moduleGraph.idToModuleMap.keys()];
}

async function readStylesheetCss(server: ViteDevServer): Promise<string> {
	const environment = server.environments.client;
	const resolved = await environment.pluginContainer.resolveId(STYLESHEET_IMPORT);
	if (resolved == null) {
		throw new Error(`Expected Vite to resolve ${STYLESHEET_IMPORT}.`);
	}
	const loaded = await environment.pluginContainer.load(resolved.id);
	const css = typeof loaded === 'string' ? loaded : loaded?.code;
	if (typeof css !== 'string') {
		throw new Error(`Expected ${STYLESHEET_IMPORT} to load as CSS.`);
	}
	return css;
}

async function readStylesheetModule(server: ViteDevServer): Promise<string> {
	const result = await server.environments.client.transformRequest(STYLESHEET_IMPORT);
	if (result?.code == null) {
		throw new Error(`Expected Vite to transform ${STYLESHEET_IMPORT}.`);
	}
	return result.code;
}

function cssFromBuild(result: Awaited<ReturnType<typeof build>>): string {
	const outputs = (Array.isArray(result) ? result : [result]).flatMap((entry) => {
		return 'output' in entry ? [entry.output] : [];
	});
	if (outputs.length === 0) throw new Error('Expected a Vite build to emit output.');
	const css = outputs
		.flat()
		.flatMap((chunk) => {
			if (chunk.type !== 'asset') return [];
			if (!chunk.fileName.endsWith('.css')) return [];
			const source = chunk.source;
			return typeof source === 'string' ? [source] : [Buffer.from(source).toString('utf8')];
		})
		.join('\n');
	if (css === '') throw new Error('Expected the Vite build to emit a CSS asset.');
	return css;
}

async function createConsumerViteFixture(color: string): Promise<{
	cleanup: () => Promise<void>;
	fixtureDir: string;
	stylesPath: string;
}> {
	const fixtureDir = await mkdtemp(path.join(tmpdir(), 'luke-ui-vite-'));
	const stylesPath = path.join(fixtureDir, 'styles.ts');
	const stylexPackageDir = path.dirname(
		require.resolve('@stylexjs/stylex/package.json', { paths: [packageRoot] }),
	);

	await mkdir(path.join(fixtureDir, 'node_modules/@stylexjs'), { recursive: true });
	await mkdir(path.join(fixtureDir, 'node_modules/@luke-ui'), { recursive: true });
	await Promise.all([
		symlink(stylexPackageDir, path.join(fixtureDir, 'node_modules/@stylexjs/stylex')),
		symlink(packageRoot, path.join(fixtureDir, 'node_modules/@luke-ui/vite')),
		writeFile(
			path.join(fixtureDir, 'index.html'),
			'<!doctype html><html><body><script type="module" src="/main.ts"></script></body></html>\n',
		),
		writeFile(
			path.join(fixtureDir, 'main.ts'),
			`import '${STYLESHEET_IMPORT}';\nimport { styles } from './styles';\nvoid styles;\n`,
		),
		writeFile(stylesPath, stylesSource(color)),
	]);

	return {
		cleanup: async () => {
			await rm(fixtureDir, { force: true, recursive: true });
		},
		fixtureDir,
		stylesPath,
	};
}

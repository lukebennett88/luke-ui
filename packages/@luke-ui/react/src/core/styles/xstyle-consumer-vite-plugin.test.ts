import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { build, createServer } from 'vite';
import type { InlineConfig, ViteDevServer } from 'vite';
import { expect, test } from 'vite-plus/test';
import { stylex } from './xstyle-consumer-vite-plugin.js';

const require = createRequire(import.meta.url);
const packageRoot = fileURLToPath(new URL('../../..', import.meta.url));
const repoRoot = path.resolve(packageRoot, '../../..');
const pluginSourcePath = fileURLToPath(
	new URL('./xstyle-consumer-vite-plugin.ts', import.meta.url),
);
const stylingGuidePath = path.join(repoRoot, 'apps/docs/content/docs/docs/styling.mdx');

const VIRTUAL_CSS_ID = 'virtual:stylex.css';
const INITIAL_COLOR = 'rgb(11,22,33)';
const UPDATED_COLOR = 'rgb(44,55,66)';
const LAYER_ORDER_PATTERN =
	/@layer reset,\s*theme,\s*base,\s*recipes,\s*xstyle\.priority\d+(?:,\s*xstyle\.priority\d+)*,\s*components,\s*utilities;/;

const FIXTURE_TIMEOUT_MS = 60_000;

test('the Styling guide publishes this Vite plugin', async () => {
	const [pluginSource, stylingGuide] = await Promise.all([
		readFile(pluginSourcePath, 'utf8'),
		readFile(stylingGuidePath, 'utf8'),
	]);
	expect(stylingGuide).toContain(`\`\`\`ts\n${pluginSource.trim()}\n\`\`\``);
});

test(
	'vite build emits application StyleX rules into the documented xstyle layer',
	{ timeout: FIXTURE_TIMEOUT_MS },
	async () => {
		const fixture = await createConsumerViteFixture(INITIAL_COLOR);
		try {
			const result = await build(viteConfig(fixture.fixtureDir, { command: 'build' }));
			const css = cssFromBuild(result);
			expectDocumentedStylexCss(css, INITIAL_COLOR);
			expect(css).not.toContain('.stylex-placeholder');
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

			const initialCss = await readVirtualCss(server);
			expectDocumentedStylexCss(initialCss, INITIAL_COLOR);
			// Populate Vite's transform cache so the later polls prove HMR invalidation,
			// not only that `load` re-ran.
			expect(await readVirtualCssModule(server)).toContain(INITIAL_COLOR);
			// The scan must not depend on Vite having transformed the StyleX module first.
			expect(moduleIds(environment).some((id) => id.includes('styles.ts'))).toBe(false);

			await writeFile(fixture.stylesPath, stylesSource(UPDATED_COLOR), 'utf8');
			server.watcher.emit('change', fixture.stylesPath);
			await expect
				.poll(() => readVirtualCssModule(server!), { timeout: 8_000 })
				.toEqual(expect.stringContaining(UPDATED_COLOR));
			const updatedCss = await readVirtualCss(server);
			expect(updatedCss).not.toContain(INITIAL_COLOR);
			expectDocumentedStylexCss(updatedCss, UPDATED_COLOR);

			await writeFile(fixture.stylesPath, 'export const unused = 1;\n', 'utf8');
			server.watcher.emit('change', fixture.stylesPath);
			await expect
				.poll(async () => (await readVirtualCssModule(server!)).includes(UPDATED_COLOR), {
					timeout: 8_000,
				})
				.toBe(false);
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
		plugins: [stylex({ rootDir: root })],
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

async function readVirtualCss(server: ViteDevServer): Promise<string> {
	const environment = server.environments.client;
	const resolved = await environment.pluginContainer.resolveId(VIRTUAL_CSS_ID);
	if (resolved == null) {
		throw new Error(`Expected Vite to resolve ${VIRTUAL_CSS_ID}.`);
	}
	const loaded = await environment.pluginContainer.load(resolved.id);
	const css = typeof loaded === 'string' ? loaded : loaded?.code;
	if (typeof css !== 'string') {
		throw new Error(`Expected ${VIRTUAL_CSS_ID} to load as CSS.`);
	}
	return css;
}

async function readVirtualCssModule(server: ViteDevServer): Promise<string> {
	const result = await server.environments.client.transformRequest(VIRTUAL_CSS_ID);
	if (result?.code == null) {
		throw new Error(`Expected Vite to transform ${VIRTUAL_CSS_ID}.`);
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
	const fixtureDir = await mkdtemp(path.join(tmpdir(), 'luke-ui-xstyle-vite-'));
	const stylesPath = path.join(fixtureDir, 'styles.ts');
	const stylexPackageDir = path.dirname(
		require.resolve('@stylexjs/stylex/package.json', { paths: [packageRoot] }),
	);

	await mkdir(path.join(fixtureDir, 'node_modules/@stylexjs'), { recursive: true });
	await symlink(stylexPackageDir, path.join(fixtureDir, 'node_modules/@stylexjs/stylex'));
	await Promise.all([
		writeFile(
			path.join(fixtureDir, 'index.html'),
			'<!doctype html><html><body><script type="module" src="/main.ts"></script></body></html>\n',
		),
		writeFile(
			path.join(fixtureDir, 'main.ts'),
			"import './layers.css';\nimport 'virtual:stylex.css';\nimport { styles } from './styles';\nvoid styles;\n",
		),
		writeFile(stylesPath, stylesSource(color)),
		writeFile(
			path.join(fixtureDir, 'layers.css'),
			'@layer reset, theme, base, recipes, xstyle, components, utilities;\n',
		),
	]);

	return {
		cleanup: async () => {
			await rm(fixtureDir, { force: true, recursive: true });
		},
		fixtureDir,
		stylesPath,
	};
}

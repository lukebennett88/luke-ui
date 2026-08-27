/**
 * Bundles a one-line entry against the built `dist/themes/<name>.js`, so it measures what a
 * consumer's bundler keeps. The identity class must not derive from `<name>Theme.name`, which would
 * make the foundation a prerequisite of the class string. A multi-layer CSS value must stay a
 * concatenated literal, not `[...].join(', ')`, because a joined value survives dead-code
 * elimination even when nothing reads it. Reads `dist`, so `build:packages` must run first.
 */

import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { describe, expect, it } from 'vite-plus/test';

const packageRoot = fileURLToPath(new URL('../../', import.meta.url));

/** Four bundler runs in one file, well over the default per-test timeout. */
const BUILD_TIMEOUT_MS = 120_000;

const VIRTUAL_ENTRY = '\0luke-ui-theme-bundle-entry';

/**
 * Foundation data that must be absent from a class-only bundle and present in a `theme` bundle. The
 * last marker is each theme's own authored accent, a hex value for Paper and an OKLCH one for
 * Tactile.
 */
const FOUNDATION_MARKERS = {
	paper: ['oklch(', 'radial-gradient(', '#185281'],
	tactile: ['oklch(', 'radial-gradient(', 'oklch(0.75 0.1 200)'],
} as const;

const bundleCache = new Map<string, Promise<string>>();

/** Memoised so the four bundles below are built once each, however many tests read them. */
function bundleThemeExport(
	themeName: keyof typeof FOUNDATION_MARKERS,
	exportName: 'theme' | 'themeClassName',
): Promise<string> {
	const cacheKey = `${themeName}:${exportName}`;
	const cached = bundleCache.get(cacheKey);
	if (cached) return cached;

	const pending = runThemeExportBuild(themeName, exportName);
	bundleCache.set(cacheKey, pending);
	return pending;
}

/** Minification stays off, so a marker cannot go missing through mangling. */
async function runThemeExportBuild(
	themeName: keyof typeof FOUNDATION_MARKERS,
	exportName: 'theme' | 'themeClassName',
): Promise<string> {
	const entrypoint = new URL(`../../../dist/themes/${themeName}.js`, import.meta.url);
	const source = `export { ${exportName} } from ${JSON.stringify(fileURLToPath(entrypoint))};`;
	const result = await build({
		build: {
			lib: { entry: VIRTUAL_ENTRY, fileName: 'entry', formats: ['es'] },
			minify: false,
			rollupOptions: { input: VIRTUAL_ENTRY },
			write: false,
		},
		configFile: false,
		logLevel: 'silent',
		plugins: [
			{
				load: (id) => (id === VIRTUAL_ENTRY ? source : null),
				name: 'luke-ui-virtual-entry',
				resolveId: (id) => (id === VIRTUAL_ENTRY ? id : null),
			},
		],
		root: packageRoot,
	});
	const outputs = (Array.isArray(result) ? result : [result]).flatMap((entry) => {
		return 'output' in entry ? [entry.output] : [];
	});
	if (outputs.length === 0) throw new Error('expected a non-watching Vite build to emit output');
	return outputs
		.flat()
		.flatMap((chunk) => (chunk.type === 'chunk' ? [chunk.code] : []))
		.join('\n');
}

function byteLength(code: string): number {
	return new TextEncoder().encode(code).byteLength;
}

for (const themeName of ['paper', 'tactile'] as const) {
	describe(`${themeName} bundled theme`, () => {
		const markers = FOUNDATION_MARKERS[themeName];

		it(
			'leaves the foundation out of a bundle that imports only themeClassName',
			async () => {
				const code = await bundleThemeExport(themeName, 'themeClassName');

				for (const marker of markers) {
					expect(code).not.toContain(marker);
				}
				expect(code).toContain('luke-ui-theme-');
			},
			BUILD_TIMEOUT_MS,
		);

		// The positive control: the negative assertions above would also pass on an empty bundle.
		it(
			'keeps the foundation in a bundle that imports theme',
			async () => {
				const code = await bundleThemeExport(themeName, 'theme');

				for (const marker of markers) {
					expect(code).toContain(marker);
				}
			},
			BUILD_TIMEOUT_MS,
		);

		// A ratio ignores output growth that hits both bundles equally, and still catches retained
		// foundation data that happens to contain none of the markers above.
		it(
			'bundles the class alone at well under the weight of the whole theme',
			async () => {
				const [classOnly, whole] = await Promise.all([
					bundleThemeExport(themeName, 'themeClassName'),
					bundleThemeExport(themeName, 'theme'),
				]);

				expect(byteLength(classOnly) / byteLength(whole)).toBeLessThan(0.5);
			},
			BUILD_TIMEOUT_MS,
		);
	});
}

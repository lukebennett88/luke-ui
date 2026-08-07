/**
 * Proves at the bundler level what tree-shaking is otherwise only assumed to do: importing a bundled
 * theme's `themeClassName` must not pull its foundation in. Each case bundles a one-line entry
 * against the built `dist/themes/<name>/index.js`, so it measures what a consumer's bundler keeps.
 *
 * This test guards two invariants. The identity class must not derive from `<name>Theme.name`,
 * which would make the foundation object a prerequisite of the class string. A multi-layer CSS
 * value must stay a concatenated literal, not `[...].join(', ')`, because a joined value survives
 * dead-code elimination even when nothing reads it.
 *
 * Runs in the `unit` project and reads `dist`, so `build:packages` must have run first.
 */

import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { describe, expect, it } from 'vite-plus/test';

const packageRoot = fileURLToPath(new URL('../../', import.meta.url));

/** Four bundler runs in one file, well over the default per-test timeout. */
const BUILD_TIMEOUT_MS = 120_000;

const VIRTUAL_ENTRY = '\0luke-ui-theme-bundle-entry';

/**
 * Foundation data that must be absent from a class-only bundle and present in a `theme` bundle.
 * Several independent markers per theme, so one bundler change that happens to drop a single string
 * cannot carry the negative case on its own. Paper authors a hex accent and Tactile an OKLCH one, so
 * the last marker is each theme's own authored accent value.
 */
const FOUNDATION_MARKERS = {
	paper: ['oklch(', 'radial-gradient(', '#185281'],
	tactile: ['oklch(', 'radial-gradient(', 'oklch(0.75 0.1 200)'],
} as const;

/**
 * A byte ceiling for a class-only bundle: room for the leaf helper and its comments, and far under
 * the foundation's own weight. A regression that retains the foundation blows straight through it.
 */
const CLASS_ONLY_CEILING_BYTES = 2_000;

/** A floor for a `theme` bundle, proving the positive control really carries the foundation. */
const THEME_FLOOR_BYTES = 3_000;

/**
 * Bundles `export { <exportName> } from '<dist entrypoint>'` and returns the emitted code. Nothing
 * reaches disk. Minification stays off, so a marker cannot go missing through mangling.
 */
async function bundleThemeExport(
	themeName: keyof typeof FOUNDATION_MARKERS,
	exportName: 'theme' | 'themeClassName',
): Promise<string> {
	const entrypoint = new URL(`../../dist/themes/${themeName}/index.js`, import.meta.url);
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
				expect(byteLength(code)).toBeLessThan(CLASS_ONLY_CEILING_BYTES);
			},
			BUILD_TIMEOUT_MS,
		);

		// The positive control. Without it the assertions above would also pass on an empty bundle
		// from a bundler that silently resolved nothing.
		it(
			'keeps the foundation in a bundle that imports theme',
			async () => {
				const code = await bundleThemeExport(themeName, 'theme');

				for (const marker of markers) {
					expect(code).toContain(marker);
				}
				expect(byteLength(code)).toBeGreaterThan(THEME_FLOOR_BYTES);
			},
			BUILD_TIMEOUT_MS,
		);
	});
}

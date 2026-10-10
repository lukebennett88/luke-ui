import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';
import packageJson from './package.json' with { type: 'json' };

/** Resolves a file in the pinned Fontsource package, so the build never downloads a font. */
function fontsourceFile(file: string): string {
	return fileURLToPath(import.meta.resolve(`@fontsource-variable/inter/${file}`));
}

export default defineConfig({
	pack: {
		copy: [
			{ from: 'src/fonts.css', to: 'dist' },
			{ from: fontsourceFile('files/inter-latin-wght-normal.woff2'), to: 'dist/fonts' },
			{ from: fontsourceFile('LICENSE'), rename: 'OFL.txt', to: 'dist/fonts' },
		],
		deps: {
			neverBundle: Object.keys(packageJson.peerDependencies),
			onlyBundle: [],
		},
		dts: true,
		entry: { index: 'src/index.ts', input: 'src/input.ts' },
		format: ['esm'],
		platform: 'neutral',
		// Keep the entries apart, so the root entry never shares a chunk with the input.
		unbundle: true,
	},
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts'],
		name: 'unit',
	},
});

import { defineConfig } from 'vite-plus';
import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
	pack: {
		copy: [
			{ from: 'src/fonts.css', to: 'dist' },
			{ from: 'src/fonts/*', to: 'dist/fonts' },
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

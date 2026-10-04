import { defineConfig } from 'vite-plus';
import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
	pack: {
		deps: {
			neverBundle: [...Object.keys(packageJson.dependencies), 'csstype'],
		},
		dts: true,
		entry: {
			'create-runtime-fn': 'src/create-runtime-fn.ts',
			index: 'src/index.ts',
		},
		format: ['esm'],
		platform: 'neutral',
		// Keep modules separate so React's create-runtime-fn import stays a thin dependency.
		unbundle: true,
	},
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts'],
		name: 'unit',
	},
});

import { defineConfig } from 'vite-plus';
import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
	pack: {
		deps: {
			neverBundle: Object.keys(packageJson.dependencies),
		},
		dts: true,
		entry: ['src/index.ts'],
		format: ['esm'],
		platform: 'neutral',
		// One output module per source module, so a consumer's bundler can still
		// tree-shake unused modules (for example the editor chunk pulling in
		// `hash.ts` without also pulling in `compile.ts`'s sucrase dependency).
		unbundle: true,
	},
});

import { defineConfig } from 'vite-plus';
import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
	pack: {
		deps: {
			neverBundle: [
				...Object.keys(packageJson.dependencies),
				// Only `src/node/generate.ts` imports Node built-ins, and it runs under Node.
				/^node:/,
			],
		},
		dts: true,
		// One entry per public subpath in `exports`. `generate` lives under
		// `src/node/` — the Node-only implementation, kept out of the browser
		// subpaths' directory — named here so its dist output stays `generate.js`.
		entry: {
			compiler: 'src/compiler.ts',
			format: 'src/format.ts',
			generate: 'src/node/generate.ts',
			hash: 'src/hash.ts',
			protocol: 'src/protocol.ts',
			specifiers: 'src/specifiers.ts',
		},
		format: ['esm'],
		platform: 'neutral',
		// One output module per source module, so a consumer's bundler can still
		// tree-shake unused modules (for example the editor chunk pulling in
		// `hash.ts` without also pulling in `compiler.ts`'s sucrase dependency).
		unbundle: true,
	},
});

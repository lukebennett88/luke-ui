import { defineConfig } from 'vite-plus';
import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
	pack: {
		deps: {
			neverBundle: [
				...Object.keys(packageJson.dependencies),
				...Object.keys(packageJson.peerDependencies),
				// Only `generate.ts` imports Node built-ins, and it runs under Node.
				/^node:/,
			],
		},
		dts: true,
		// One entry per public subpath in `exports`.
		entry: [
			'src/compiler.ts',
			'src/format.ts',
			'src/generate.ts',
			'src/hash.ts',
			'src/protocol.ts',
			'src/specifiers.ts',
		],
		format: ['esm'],
		platform: 'neutral',
		// One output module per source module, so a consumer's bundler can still
		// tree-shake unused modules (for example the editor chunk pulling in
		// `hash.ts` without also pulling in `compiler.ts`'s sucrase dependency).
		unbundle: true,
	},
});

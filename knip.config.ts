import type { KnipConfig } from 'knip';

export default {
	ignoreBinaries: ['xdg-open'],
	ignoreDependencies: ['eslint-plugin-react-hooks'],
	rules: {
		cycles: 'error',
	},
	workspaces: {
		'apps/docs': {
			entry: [
				'source.config.ts',
				'scripts/**/*.ts',
				// Compiled to an inline-able IIFE by the `pack` config in vite.config.ts.
				'src/components/playground/editor-skeleton-script.ts',
				// Read by path, not imported: the prop analysis loads source files through ts-morph.
				'src/lib/__fixtures__/**/*.ts',
				'src/routes/**/*.ts',
				'src/routes/**/*.tsx',
				'src/examples/**/*',
				'src/styles/app.css',
				'content/**/*.mdx',
			],
			project: ['src/**/*.{ts,tsx}'],
		},
		'packages/@luke-ui/react': {
			entry: [
				'src/**/*.stories.tsx',
				'src/exports/**/*.ts',
				'src/core/stylesheet.css.ts',
				'src/core/styles/index.css.ts',
				// Its own `pack` entry in vite.config.ts, so nothing in `src/` imports it.
				'src/core/styles/stylex-fixture.ts',
				'scripts/**/*.ts',
			],
			project: ['src/**/*.{ts,tsx}'],
		},
		'packages/turbo-generators': {
			entry: ['config.ts'],
			project: ['**/*.ts'],
		},
	},
} satisfies KnipConfig;

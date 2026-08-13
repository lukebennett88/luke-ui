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
				'src/**/index.ts',
				'src/stylesheet.css.ts',
				'src/styles/index.css.ts',
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

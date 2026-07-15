import type { KnipConfig } from 'knip';

export default {
	ignoreBinaries: ['open', 'xdg-open'],
	ignoreDependencies: ['eslint-plugin-react-hooks'],
	workspaces: {
		'apps/docs': {
			entry: [
				'scripts/**/*.ts',
				// Compiled to an inline-able IIFE by the `pack` config in vite.config.ts.
				'src/components/playground/editor-skeleton-script.ts',
				'source.config.ts',
				'src/router.tsx',
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
				'src/**/index.tsx',
				'src/**/index.ts',
				'src/stylesheet.css.ts',
				'src/styles/index.css.ts',
				'src/theme/index.tsx',
				'src/utils/index.ts',
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

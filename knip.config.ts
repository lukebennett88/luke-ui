import type { KnipConfig } from 'knip';

export default {
	workspaces: {
		'packages/turbo-generators': {
			entry: ['config.ts'],
			project: ['**/*.ts'],
		},
		'apps/docs': {
			entry: [
				'source.config.ts',
				'src/router.tsx',
				'src/routes/**/*.ts',
				'src/routes/**/*.tsx',
				'src/styles/app.css',
				'content/**/*.mdx',
				'src/components/render-markdown.tsx',
			],
			project: ['src/**/*.{ts,tsx}'],
			ignoreDependencies: ['ts-morph'],
		},
		'packages/@luke-ui/react': {
			entry: [
				'src/**/*.stories.tsx',
				'src/**/index.tsx',
				'src/**/index.ts',
				'src/stylesheet.css.ts',
				'src/styles/index.css.ts',
				'src/theme/index.tsx',
				'src/tokens/index.ts',
				'src/utils/index.ts',
				'scripts/**/*.ts',
			],
			project: ['src/**/*.{ts,tsx}'],
		},
	},
} satisfies KnipConfig;

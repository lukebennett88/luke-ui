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
			],
			project: ['src/**/*.{ts,tsx}'],
		},
		'packages/@luke-ui/react': {
			entry: [
				'src/**/*.stories.tsx',
				'src/**/*.docs.mdx',
				'src/**/index.tsx',
				'src/**/index.ts',
				'src/**/primitive.tsx',
				'src/stylesheet.css.ts',
				'src/styles/index.css.ts',
				'src/theme/index.tsx',
				'src/tokens/index.ts',
				'src/utils/index.ts',
			],
			project: ['src/**/*.{ts,tsx}'],
		},
	},
} satisfies KnipConfig;

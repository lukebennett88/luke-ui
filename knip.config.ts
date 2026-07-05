import type { KnipConfig } from 'knip';

export default {
	ignoreDependencies: ['eslint-plugin-react-hooks'],
	workspaces: {
		'apps/docs': {
			entry: [
				'source.config.ts',
				'src/router.tsx',
				'src/routes/**/*.ts',
				'src/routes/**/*.tsx',
				'src/examples/**/*.tsx',
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
				'src/tokens/index.ts',
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

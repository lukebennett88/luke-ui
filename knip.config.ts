import type { KnipConfig } from 'knip';

export default {
	ignore: ['.claude/worktrees/**', '.worktrees/**'],
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
		'packages/@luke-ui/docs-tools': {
			entry: ['src/**/__tests__/**/*.test.ts'],
			project: ['src/**/*.ts'],
		},
	},
} satisfies KnipConfig;

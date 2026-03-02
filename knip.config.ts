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
				'src/lib/source.ts',
				'src/styles/app.css',
			],
			ignoreDependencies: [
				'@tanstack/react-router-devtools',
				'@vanilla-extract/vite-plugin',
				'srvx',
			],
			project: ['src/**/*.{ts,tsx}', 'content/**/*.mdx'],
		},
		'packages/@luke-ui/react': {
			entry: ['src/**/*.stories.tsx', 'src/**/*.docs.mdx'],
			ignoreDependencies: [
				'@vitest/coverage-v8',
				'babel-plugin-react-compiler',
			],
			project: ['src/**/*.{ts,tsx,mdx}'],
		},
	},
} satisfies KnipConfig;

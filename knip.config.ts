import type { KnipConfig } from 'knip';

export default {
	rules: {
		cycles: 'error',
	},
	workspaces: {
		'apps/docs': {
			entry: [
				'scripts/**/*.ts',
				// Compiled to inline-able IIFEs by the `pack` config in vite.config.ts.
				'src/components/playground/editor-skeleton-script.ts',
				'src/lib/theme-prefs-bootstrap-script.ts',
				// Read by path, not imported: the prop analysis loads source files through ts-morph.
				'src/lib/__fixtures__/**/*.ts',
				'src/routes/**/*.ts',
				'src/routes/**/*.tsx',
				'src/examples/**/*',
				'src/styles/app.css',
				'content/**/*.mdx',
			],
			project: ['src/**/*.{ts,tsx,css}', 'content/**/*.mdx'],
		},
		'packages/@luke-ui/react': {
			entry: [
				'src/exports/**/*.ts',
				'src/core/stylesheet.css.ts',
				'src/core/styles/index.css.ts',
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

import type { KnipConfig } from 'knip';

export default {
	ignoreBinaries: ['xdg-open'],
	rules: {
		cycles: 'error',
	},
	workspaces: {
		'apps/docs': {
			entry: [
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
			project: ['src/**/*.{ts,tsx,css}', 'content/**/*.mdx'],
		},
		'packages/@luke-ui/react': {
			entry: [
				'src/**/*.stories.tsx',
				'src/exports/**/*.ts',
				'src/core/stylesheet.css.ts',
				'src/core/styles/index.css.ts',
				'scripts/**/*.ts',
			],
			// `.mdx` is included because Storybook's Knip plugin registers an MDX
			// compiler for every workspace it detects, even though this package has
			// no MDX stories.
			project: ['src/**/*.{ts,tsx,mdx}'],
		},
		'packages/turbo-generators': {
			entry: ['config.ts'],
			project: ['**/*.ts'],
		},
	},
} satisfies KnipConfig;

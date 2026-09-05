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
			// `.css` and `.mdx` are in `project` so knip follows the imports inside the
			// `src/styles/app.css` and `content/**/*.mdx` entries above rather than treating
			// them as opaque leaves.
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
			// `stylex-vite-plugin.ts` lives at package root, beside `vite.config.ts`/`vitest.config.ts`
			// (which knip auto-detects as entries), so it needs an explicit project glob to be seen.
			// `.mdx` is here because knip's Storybook plugin contributes `**/*.mdx` entry patterns;
			// the extension has to be in `project` for those imports to be followed, even though the
			// package currently has no docs pages of its own.
			project: ['src/**/*.{ts,tsx,mdx}', 'stylex-vite-plugin.ts'],
		},
		'packages/@luke-ui/vite': {
			entry: ['src/index.ts', 'src/stylesheet.css'],
			project: ['src/**/*.ts'],
		},
		'packages/turbo-generators': {
			entry: ['config.ts'],
			project: ['**/*.ts'],
		},
	},
} satisfies KnipConfig;

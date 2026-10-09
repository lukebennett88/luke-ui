import type { KnipConfig } from 'knip';

export default {
	rules: {
		cycles: 'error',
	},
	workspaces: {
		'.': {
			entry: ['functions/**/*.ts'],
			project: ['functions/**/*.ts'],
		},
		'apps/docs': {
			entry: [
				'scripts/**/*.ts',
				// Compiled to an inline-able IIFE by the `pack` config in vite.config.ts.
				'src/components/playground/editor-skeleton-script.ts',
				'src/lib/theme-prefs-script.ts',
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
		'apps/reference-app': {
			entry: ['src/**/*.browser.test.tsx'],
			project: ['src/**/*.{ts,tsx}'],
		},
		'packages/@luke-ui/playground-core': {
			entry: [
				'src/compiler.ts',
				'src/format.ts',
				'src/hash.ts',
				'src/node/generate.ts',
				'src/protocol.ts',
				'src/specifiers.ts',
			],
			project: ['src/**/*.ts'],
		},
		'packages/@luke-ui/rainbow-sprinkles': {
			entry: ['src/index.ts', 'src/create-runtime-fn.ts', 'vite.config.ts'],
			project: ['src/**/*.ts', 'vite.config.ts'],
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
		'packages/@luke-ui/theme-paper': {
			entry: ['src/index.ts', 'src/input.ts'],
			project: ['src/**/*.ts', 'scripts/**/*.js'],
		},
		'packages/@luke-ui/theme-tactile': {
			entry: ['src/index.ts', 'src/input.ts'],
			project: ['src/**/*.ts', 'scripts/**/*.js'],
		},
		'packages/turbo-generators': {
			entry: ['config.ts'],
			project: ['**/*.ts'],
		},
	},
} satisfies KnipConfig;

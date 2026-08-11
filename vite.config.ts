import { defineConfig } from 'vite-plus';
import { repoFmtOptions } from './apps/docs/src/lib/repo-fmt-options.js';

export default defineConfig({
	fmt: {
		...repoFmtOptions,
		ignorePatterns: [
			'.source',
			'**/.generated/entries.*',
			'**/.generated/icon-data.*',
			'**/*.hbs',
			'packages/turbo-generators/templates/**',
			'**/dist/**',
			'**/routeTree.gen.ts',
			'**/storybook-static/**',
			// Golden fixtures are frozen `buildTheme` output, asserted byte-identical in tests; they must
			// never be reformatted.
			'**/__fixtures__/v2-goldens/**',
			'node_modules',
		],
		overrides: [{ files: ['**/*.css.ts'], options: { sortImports: { sortSideEffects: false } } }],
		proseWrap: 'always',
	},
	lint: {
		categories: {
			correctness: 'deny',
			perf: 'deny',
		},
		ignorePatterns: [
			'node_modules',
			'.source',
			'**/dist/**',
			'**/storybook-static/**',
			'**/routeTree.gen.ts',
		],
		jsPlugins: [
			{
				name: 'react-hooks-js',
				specifier: 'eslint-plugin-react-hooks',
			},
			{
				name: 'vite-plus',
				specifier: 'vite-plus/oxlint-plugin',
			},
		],
		options: {
			typeAware: true,
			typeCheck: true,
		},
		plugins: ['import', 'jsx-a11y', 'react', 'typescript', 'vitest'],
		rules: {
			curly: 'off',
			'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
			'import/no-duplicates': 'error',
			'jsdoc/check-access': 'error',
			'jsdoc/check-property-names': 'error',
			'jsdoc/check-tag-names': 'error',
			'jsdoc/empty-tags': 'error',
			'jsx-a11y/prefer-tag-over-role': 'off',
			'no-console': 'warn',
			'no-unused-vars': 'error',
			'vitest/expect-expect': [
				'error',
				{ assertFunctionNames: ['captureVisual', 'captureVisualAppearance', 'expect'] },
			],
			'react-hooks-js/config': 'error',
			'react-hooks-js/error-boundaries': 'error',
			'react-hooks-js/gating': 'error',
			'react-hooks-js/globals': 'error',
			'react-hooks-js/immutability': 'error',
			'react-hooks-js/incompatible-library': 'warn',
			'react-hooks-js/preserve-manual-memoization': 'error',
			'react-hooks-js/purity': 'error',
			'react-hooks-js/refs': 'error',
			'react-hooks-js/set-state-in-effect': 'error',
			'react-hooks-js/set-state-in-render': 'error',
			'react-hooks-js/static-components': 'error',
			'react-hooks-js/unsupported-syntax': 'warn',
			'react-hooks-js/use-memo': 'error',
			'react/exhaustive-deps': 'warn',
			'react/no-array-index-key': 'off',
			'react/rules-of-hooks': 'error',
			'sort-imports': 'off',
			'typescript/array-type': ['error', { default: 'generic' }],
			'typescript/consistent-type-exports': [
				'error',
				{ fixMixedExportsWithInlineTypeSpecifier: false },
			],
			'typescript/consistent-type-imports': [
				'error',
				{ fixStyle: 'separate-type-imports', prefer: 'type-imports' },
			],
			'vite-plus/prefer-vite-plus-imports': 'error',
		},
		overrides: [
			{
				files: ['packages/@luke-ui/react/src/**/*.browser.test.tsx'],
				excludeFiles: [
					'packages/@luke-ui/react/src/theme/**',
					'packages/@luke-ui/react/src/styles/**',
					'packages/@luke-ui/react/src/use-synchronize-animations/**',
				],
				rules: {
					'no-restricted-imports': [
						'error',
						{
							paths: [
								{
									name: 'react-dom/client',
									message: 'Mount components through src/test-utils/render.tsx.',
								},
								{
									name: '@luke-ui/react/theme',
									message:
										'Do not assert resolved theme tokens in component tests. Suppress this rule only for structural fixture setup.',
								},
							],
						},
					],
				},
			},
			{
				files: ['packages/@luke-ui/react/src/**/*.visual.test.tsx'],
				excludeFiles: ['packages/@luke-ui/react/src/theme/**'],
				rules: {
					'no-await-in-loop': 'off',
					'no-restricted-imports': [
						'error',
						{
							paths: [
								{
									name: 'react-dom/client',
									message: 'Mount components through src/test-utils/render.tsx.',
								},
							],
						},
					],
				},
			},
		],
	},
});

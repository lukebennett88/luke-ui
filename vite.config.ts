import { defineConfig } from 'vite-plus';

export default defineConfig({
	fmt: {
		arrowParens: 'always',
		bracketSameLine: false,
		bracketSpacing: true,
		ignorePatterns: [
			'.source',
			'**/.generated/entries.*',
			'**/.generated/icon-data.*',
			'**/*.hbs',
			'packages/turbo-generators/templates/**',
			'**/dist/**',
			'**/routeTree.gen.ts',
			'node_modules',
		],
		jsxSingleQuote: false,
		overrides: [{ files: ['**/*.css.ts'], options: { sortImports: { sortSideEffects: false } } }],
		printWidth: 100,
		proseWrap: 'always',
		quoteProps: 'as-needed',
		semi: true,
		singleAttributePerLine: false,
		singleQuote: true,
		sortImports: {
			customGroups: [{ elementNamePattern: ['*:*'], groupName: 'protocol' }],
			groups: [
				['side_effect_style', 'side_effect'],
				'protocol',
				['builtin', 'external', 'type-builtin', 'type-external'],
				['subpath', 'internal', 'type-subpath', 'type-internal'],
				['parent', 'sibling', 'index', 'type-parent', 'type-sibling', 'type-index'],
				'unknown',
			],
			ignoreCase: false,
			newlinesBetween: false,
			sortSideEffects: true,
		},
		tabWidth: 2,
		trailingComma: 'all',
		useTabs: true,
	},
	lint: {
		categories: {
			correctness: 'deny',
			perf: 'deny',
			suspicious: 'deny',
		},
		env: {
			browser: true,
			builtin: true,
			es2024: true,
			node: true,
		},
		ignorePatterns: [
			'**/node_modules/**',
			'.source',
			'**/dist/**',
			'**/routeTree.gen.ts',
			'**/*.tsbuildinfo',
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
		overrides: [
			{
				// Docs examples are copyable source. Allow intentional `tabIndex={0}` on scrollable
				// non-interactive elements, and demo iframes, without suppression comments in the
				// published samples.
				files: ['apps/docs/src/examples/**/*.{ts,tsx}'],
				rules: {
					'jsx-a11y/no-noninteractive-tabindex': 'off',
					'react/iframe-missing-sandbox': 'off',
				},
			},
			{
				// Only `@luke-ui/react` runs the React Compiler; use its dep analysis here.
				files: ['packages/@luke-ui/react/src/**/*.{ts,tsx}'],
				rules: {
					'react/exhaustive-deps': 'off',
					'react/exhaustive-effect-dependencies': 'error',
					'react/memo-dependencies': 'error',
					'react/preserve-manual-memoization': 'error',
					'react/capitalized-calls': 'error',
					// Compiler memoises context values.
					'react/jsx-no-constructed-context-values': 'off',
					'react-hooks-js/component-hook-factories': 'error',
					'react-hooks-js/config': 'error',
					'react-hooks-js/gating': 'error',
				},
			},
			{
				excludeFiles: [
					'packages/@luke-ui/react/src/theme/**',
					'packages/@luke-ui/react/src/core/styles/**',
					'packages/@luke-ui/react/src/core/use-synchronize-animations/**',
				],
				files: ['packages/@luke-ui/react/src/**/*.browser.test.tsx'],
				rules: {
					// Visual captures walk the appearance matrix one screenshot at a time:
					// each capture resizes the shared viewport, so they cannot be parallelised.
					'no-await-in-loop': 'off',
					'no-restricted-imports': [
						'error',
						{
							paths: [
								{
									message: 'Mount components through src/core/test-utils/render.tsx.',
									name: 'react-dom/client',
								},
							],
						},
					],
				},
			},
			{
				excludeFiles: ['**/*.test.*', '**/__fixtures__/**'],
				files: ['packages/@luke-ui/react/src/core/**/*.{ts,tsx}'],
				rules: {
					'no-restricted-imports': [
						'error',
						{
							patterns: [
								{
									group: ['**/exports/**'],
									message: 'Core modules must not import public export modules.',
								},
							],
						},
					],
				},
			},
			{
				excludeFiles: ['**/*.test.*', '**/__fixtures__/**'],
				files: ['packages/@luke-ui/react/src/theme/**/*.{ts,tsx}'],
				rules: {
					'no-restricted-imports': [
						'error',
						{
							patterns: [
								{
									group: ['**/core/**', '**/exports/**'],
									message: 'Theme modules must not import from core or exports.',
								},
							],
						},
					],
				},
			},
			{
				excludeFiles: ['**/*.test.*', '**/__fixtures__/**'],
				files: ['packages/@luke-ui/react/src/shared/**/*.{ts,tsx}'],
				rules: {
					'no-restricted-imports': [
						'error',
						{
							patterns: [
								{
									group: ['**/core/**', '**/theme/**', '**/exports/**'],
									message: 'Shared modules must not import from core, theme, or exports.',
								},
							],
						},
					],
				},
			},
			{
				// These modules back the browser subpaths, so they must not pull in
				// Node-only code, including the Node-only implementation under `node/`.
				excludeFiles: ['**/*.test.*', 'packages/@luke-ui/playground-core/src/node/**'],
				files: ['packages/@luke-ui/playground-core/src/**/*.ts'],
				rules: {
					'import/no-nodejs-modules': 'error',
					'no-restricted-imports': [
						'error',
						{
							patterns: [
								{
									group: ['**/node/**'],
									message:
										'Browser subpaths must not import Node built-ins or the node/ directory.',
								},
							],
						},
					],
				},
			},
			{
				files: ['**/*.{test,browser.test}.{ts,tsx}'],
				rules: {
					// Nested fixtures in tests often declare helpers that capture nothing; hoisting hurts readability.
					'unicorn/consistent-function-scoping': 'off',
				},
			},
		],
		// Setting `plugins` replaces oxlint defaults, so include unicorn + oxc explicitly.
		plugins: [
			'import',
			'jsdoc',
			'jsx-a11y',
			'node',
			'oxc',
			'react',
			'typescript',
			'unicorn',
			'vitest',
		],
		// Categories deny correctness+perf. Rules below are exceptions, options, or non-category policies.
		rules: {
			curly: 'off',
			'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
			'import/no-duplicates': 'error',
			'import/no-unassigned-import': ['error', { allow: ['**/*.css', '**/*.css.js'] }],
			'jsdoc/check-access': 'error',
			'jsdoc/check-property-names': 'error',
			'jsdoc/check-tag-names': 'error',
			'jsdoc/empty-tags': 'error',
			'jsdoc/require-yields': 'off',
			'jsx-a11y/prefer-tag-over-role': 'off',
			'no-console': 'error',
			// Internal `_Prop` aliases, `__dirname`, and event-name prefixes are intentional.
			'no-underscore-dangle': 'off',
			'no-unused-vars': 'error',
			'no-var': 'error',
			'oxc/no-accumulating-spread': 'error',
			'prefer-const': 'error',
			'prefer-rest-params': 'error',
			'prefer-spread': 'error',
			// Classic hooks stay repo-wide. Compiler memoization / plugin rules: `@luke-ui/react` only.
			'react-hooks-js/component-hook-factories': 'off',
			'react-hooks-js/config': 'off',
			'react-hooks-js/gating': 'off',
			'react/capitalized-calls': 'off',
			'react/error-boundaries': 'error',
			'react/exhaustive-deps': 'error',
			'react/exhaustive-effect-dependencies': 'off',
			'react/globals': 'error',
			'react/hooks': 'off',
			'react/immutability': 'error',
			'react/incompatible-library': 'error',
			'react/memo-dependencies': 'off',
			'react/no-array-index-key': 'off',
			'react/preserve-manual-memoization': 'off',
			'react/purity': 'error',
			'react/react-in-jsx-scope': 'off',
			'react/refs': 'error',
			'react/rules-of-hooks': 'error',
			'react/set-state-in-effect': 'error',
			'react/set-state-in-render': 'error',
			'react/static-components': 'error',
			'react/unsupported-syntax': 'error',
			'react/use-memo': 'error',
			'sort-imports': 'off',
			'typescript/array-type': ['error', { default: 'generic' }],
			'typescript/consistent-return': 'off',
			'typescript/consistent-type-exports': [
				'error',
				{ fixMixedExportsWithInlineTypeSpecifier: false },
			],
			'typescript/consistent-type-imports': [
				'error',
				{ fixStyle: 'separate-type-imports', prefer: 'type-imports' },
			],
			// A method signature is bivariant in its parameters, so it accepts an argument the
			// declaration rules out. `strict` does not cover this: `strictFunctionTypes` exempts method
			// shorthand by design. It matters most where a hand-written interface models an external
			// API and a cast asserts the match, as the docs prop analysis does with ts-morph.
			'typescript/method-signature-style': ['error', 'property'],
			'typescript/no-explicit-any': 'off',
			'typescript/no-generated-empty-object-type': 'off',
			// Explicit default type args document selection mode (e.g. Combobox `'single'`).
			'typescript/no-unnecessary-type-arguments': 'off',
			// Theme/generics code uses intentional narrow casts; with `suspicious` enabled these fire too often.
			'typescript/no-unnecessary-type-assertion': 'off',
			'typescript/no-unnecessary-type-conversion': 'off',
			'typescript/no-unnecessary-type-parameters': 'off',
			'typescript/no-unsafe-type-assertion': 'off',
			'unicorn/consistent-empty-array-spread': 'error',
			'unicorn/no-abusive-eslint-disable': 'error',
			'unicorn/no-array-reduce': 'error',
			'unicorn/no-invalid-fetch-options': 'error',
			'unicorn/no-typeof-undefined': 'error',
			'unicorn/no-unnecessary-slice-end': 'error',
			'unicorn/no-useless-promise-resolve-reject': 'error',
			'unicorn/no-useless-spread': 'error',
			// Image/media element handlers commonly use `onload` / `onerror` properties.
			'unicorn/prefer-add-event-listener': 'off',
			'unicorn/prefer-array-flat-map': 'error',
			'unicorn/prefer-array-index-of': 'error',
			'unicorn/prefer-array-some': 'error',
			'unicorn/prefer-native-coercion-functions': 'error',
			'unicorn/prefer-node-protocol': 'error',
			'unicorn/prefer-optional-catch-binding': 'error',
			'unicorn/prefer-set-size': 'error',
			'vite-plus/prefer-vite-plus-imports': 'error',
			'vitest/expect-expect': [
				'error',
				{
					// Type tests use these assertion helpers, which the rule does not recognise by default.
					assertFunctionNames: [
						'assertType',
						'captureVisual',
						'captureVisualAppearance',
						'expect',
						'expectAccessibleNameWords',
						'expectForwardsDomProps',
						'expectNoAxeViolations',
						'expectTypeOf',
					],
				},
			],
			// Table-driven suites pass string variables as titles; oxlint flags those even with `allowArguments`.
			'vitest/valid-title': 'off',
		},
	},
});

import { defineConfig } from 'vite-plus';

export const docsLintOverrides =
	defineConfig({
		lint: {
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
					excludeFiles: [
						'**/*.test.*',
						'apps/docs/src/playground/generate/**',
						'apps/docs/src/playground/docs-playground-specifiers.ts',
					],
					files: [
						'apps/docs/src/playground/**/*.{ts,tsx}',
						'apps/docs/src/routes/playground/**/*.{ts,tsx}',
						'apps/docs/src/components/example-preview.tsx',
					],
					rules: {
						'import/no-nodejs-modules': 'error',
						'no-restricted-imports': [
							'error',
							{
								patterns: [
									{
										allowTypeImports: true,
										group: [
											'**/generate/**',
											'**/docs-playground-specifiers*',
											'@luke-ui/playground-core/generate',
										],
										message:
											'Playground browser modules must not import generators or build-only host policy.',
									},
								],
							},
						],
					},
				},
				{
					excludeFiles: ['**/*.test.*', 'apps/docs/src/type-reference/generate/**'],
					files: ['apps/docs/src/type-reference/**/*.{ts,tsx}'],
					rules: {
						'import/no-nodejs-modules': 'error',
						'no-restricted-imports': [
							'error',
							{
								patterns: [
									{
										allowTypeImports: true,
										group: ['**/generate/**'],
										message:
											'Type reference browser modules must not import generator implementations.',
									},
								],
							},
						],
					},
				},
				{
					files: ['apps/docs/src/playground/generate/**/*.ts'],
					rules: { 'no-console': 'off' },
				},
			],
		},
	}).lint?.overrides ?? [];

import type { OxlintOverride } from 'vite-plus/lint';

export const squintLintOverrides = [
	{
		// The Pages worker runs on Cloudflare, not Node, and bundles only its own modules.
		files: ['apps/squint/src/worker/**/*.ts'],
		rules: {
			'import/no-nodejs-modules': 'error',
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							// The API contract is shared: both sides parse the same responses.
							group: ['../**', '!../api/contract.js'],
							message: 'The worker must not import the browser app.',
						},
					],
				},
			],
		},
	},
	{
		excludeFiles: ['apps/squint/src/worker/**'],
		files: ['apps/squint/src/**/*.{ts,tsx}'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['**/worker/**'],
							message: 'The browser app must not bundle the worker.',
						},
					],
				},
			],
		},
	},
] satisfies Array<OxlintOverride>;

import { defineConfig } from 'vite-plus';

export const referenceAppLintOverrides = defineConfig({
	lint: {
		overrides: [
			{
				files: ['apps/reference-app/src/settings/**/*.{ts,tsx}'],
				rules: {
					'no-restricted-imports': [
						'error',
						{
							patterns: [
								{
									group: ['**/routes/**'],
									message: 'Settings modules must not import route modules.',
								},
							],
						},
					],
				},
			},
			{
				files: ['apps/reference-app/src/settings/profile/**/*.{ts,tsx}'],
				rules: {
					'no-restricted-imports': [
						'error',
						{
							patterns: [
								{
									group: ['**/routes/**', '**/preferences/**', '**/security/**'],
									message: 'Settings features must not import routes or other settings features.',
								},
							],
						},
					],
				},
			},
			{
				files: ['apps/reference-app/src/settings/preferences/**/*.{ts,tsx}'],
				rules: {
					'no-restricted-imports': [
						'error',
						{
							patterns: [
								{
									group: ['**/routes/**', '**/profile/**', '**/security/**'],
									message: 'Settings features must not import routes or other settings features.',
								},
							],
						},
					],
				},
			},
			{
				files: ['apps/reference-app/src/settings/security/**/*.{ts,tsx}'],
				rules: {
					'no-restricted-imports': [
						'error',
						{
							patterns: [
								{
									group: ['**/routes/**', '**/profile/**', '**/preferences/**'],
									message: 'Settings features must not import routes or other settings features.',
								},
							],
						},
					],
				},
			},
		],
	},
}).lint.overrides;

import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';
import { localReport, visualReviewTheme } from './vite.plugins.js';

// The tests mount the app without TanStack Start, so this config leaves out its plugin.
export default defineConfig({
	plugins: [visualReviewTheme(), localReport(), vanillaExtractPlugin(), react()],
	test: {
		projects: [
			{
				extends: true,
				test: { include: ['src/**/*.test.ts'], name: 'unit' },
			},
			{
				extends: true,
				optimizeDeps: { include: ['axe-core'] },
				test: {
					browser: {
						enabled: true,
						headless: true,
						instances: [{ browser: 'chromium' }],
						provider: playwright({}),
					},
					// Pull request reports come from this origin, which the tests' mocked fetch answers.
					env: { VITE_VISUAL_REVIEW_DATA_URL_TEMPLATE: 'https://pr-{pr}.reports.test' },
					include: ['src/**/*.browser.test.tsx'],
					name: 'browser',
					setupFiles: ['./src/test/browser-setup.ts'],
				},
			},
		],
	},
});

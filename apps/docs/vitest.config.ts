import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';

export default defineConfig({
	plugins: [tailwindcss()],
	optimizeDeps: {
		include: [
			'next-themes',
			'react-aria-components/ToggleButton',
			'react-aria-components/ToggleButtonGroup',
		],
	},
	test: {
		passWithNoTests: true,
		projects: [
			{
				extends: true,
				test: {
					environment: 'node',
					exclude: ['**/node_modules/**', '**/*.browser.test.*'],
					include: ['src/**/*.test.ts', 'vite-config.test.ts'],
					name: 'unit',
				},
			},
			{
				extends: true,
				test: {
					browser: {
						enabled: true,
						headless: true,
						instances: [{ browser: 'chromium' }],
						provider: playwright({}),
					},
					include: ['src/**/*.browser.test.{ts,tsx}'],
					name: 'browser',
					setupFiles: ['./src/test-utils/browser-setup.ts'],
				},
			},
		],
	},
});

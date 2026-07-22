import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';
import { pandaCss } from './panda-css-vite-plugin';

export default defineConfig({
	// Panda must run before `@tailwindcss/vite` here too, so the browser test's
	// `import './app.css'` gets the docs atomics injected — see panda-css-vite-plugin.
	plugins: [pandaCss(), tailwindcss()],
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
					include: ['src/**/*.test.ts', 'vite-config.test.ts', '*.integration.test.ts'],
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

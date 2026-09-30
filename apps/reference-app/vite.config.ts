import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';

export default defineConfig({
	optimizeDeps: {
		include: [
			'react-aria-components/Button',
			'react-aria-components/Dialog',
			'react-aria-components/ListBox',
			'react-aria-components/Menu',
			'react-aria-components/Modal',
			'react-aria-components/Popover',
			'react-aria-components/Select',
			'react-aria-components/Switch',
		],
	},
	plugins: [vanillaExtractPlugin(), react()],
	server: {
		port: 5174,
	},
	test: {
		passWithNoTests: true,
		projects: [
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
					setupFiles: ['./src/test/browser-setup.ts'],
				},
			},
		],
	},
});

import { defineTheme } from '@luke-ui/react/theme/compiler';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite-plus';
import { defineConfig } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';
import { referenceThemeInput } from './src/theme/input.js';

export default defineConfig({
	optimizeDeps: {
		include: [
			'react-aria-components',
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
	plugins: [referenceTheme(), vanillaExtractPlugin(), react()],
	server: {
		port: 5174,
	},
	test: {
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

/**
 * Serves the product theme as `virtual:reference-theme.css`. Vite restarts when `src/theme/input.ts`
 * changes because it is a config dependency.
 */
function referenceTheme(): Plugin {
	const id = 'virtual:reference-theme.css';
	const resolvedId = `\0${id}`;
	return {
		load: (loadId) => (loadId === resolvedId ? defineTheme(referenceThemeInput) : undefined),
		name: 'reference-theme',
		resolveId: (source) => (source === id ? resolvedId : undefined),
	};
}

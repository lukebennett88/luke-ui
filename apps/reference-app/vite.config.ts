import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type * as ThemeCompiler from '@luke-ui/react/theme/compiler';
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
		async load(loadId) {
			if (loadId !== resolvedId) return;
			const compiler = new URL(import.meta.resolve('@luke-ui/react/theme/compiler'));
			this.addWatchFile(fileURLToPath(compiler));
			// Refresh Node's cached compiler when the workspace build changes.
			compiler.search = `build=${randomUUID()}`;
			const { defineTheme }: typeof ThemeCompiler = await import(compiler.href);
			return defineTheme(referenceThemeInput);
		},
		name: 'reference-theme',
		resolveId: (source) => (source === id ? resolvedId : undefined),
	};
}

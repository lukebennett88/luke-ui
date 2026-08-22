import tailwindcss from '@tailwindcss/vite';
import mdx from 'fumadocs-mdx/vite';
import { defineConfig } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';
import * as sourceConfig from './source.config.js';

export default defineConfig({
	optimizeDeps: {
		include: [
			'next-themes',
			'react-aria-components/Dialog',
			'react-aria-components/Modal',
			'react-aria-components/Popover',
			'react-aria-components/ToggleButton',
			'react-aria-components/ToggleButtonGroup',
			'react-resizable-panels',
		],
	},
	plugins: [tailwindcss(), mdx(sourceConfig)],
	test: {
		passWithNoTests: true,
		projects: [
			{
				extends: true,
				test: {
					environment: 'node',
					exclude: ['**/node_modules/**', '**/*.browser.test.*'],
					include: ['src/**/*.test.ts'],
					name: 'unit',
				},
			},
			{
				extends: true,
				test: {
					browser: {
						commands: {
							clickExamplePreviewButton: async ({ iframe }, name: string) => {
								await iframe
									.locator('iframe[title^="Preview of "]')
									.contentFrame()
									.getByRole('button', { name })
									.click();
							},
							clickExamplePreviewOption: async ({ iframe }, name: string) => {
								await iframe
									.locator('iframe[title^="Preview of "]')
									.contentFrame()
									.getByRole('option', { name })
									.click();
							},
							dragFromSeparator: async ({ iframe, page }, offsetX: number, dragBy: number) => {
								const box = await iframe.locator('[role="separator"]').boundingBox();
								if (!box) throw new Error('separator not found');
								const x = box.x + box.width / 2 + offsetX;
								const y = box.y + box.height / 2;
								await page.mouse.move(x, y);
								await page.mouse.down();
								await page.mouse.move(x + dragBy, y, { steps: 10 });
								await page.mouse.up();
							},
						},
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

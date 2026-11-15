import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';
import { stat } from 'node:fs/promises';
import type { Plugin } from 'vite-plus';
import { defineConfig } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';

const LOCAL_REPORT_ROUTE = '/__local-report';
const LOCAL_REPORT_FILE_PATTERN =
	/^\/(?:summary\.json|diff\/[a-z0-9-]+\/[a-z0-9-]+\.(?:expected|actual|diff)\.png)$/;

export default defineConfig({
	plugins: [localReport(), vanillaExtractPlugin(), react()],
	server: {
		port: 5175,
	},
	test: {
		projects: [
			{
				extends: true,
				test: { include: ['src/**/*.test.ts'], name: 'unit' },
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
					include: ['src/**/*.browser.test.tsx'],
					name: 'browser',
					setupFiles: ['./src/test/browser-setup.ts'],
				},
			},
		],
	},
});

/**
 * Serves a local comparison at `/__local-report` while developing, so `?source=local` reviews the
 * output of `pnpm test:visual`. Set `VISUAL_REVIEW_LOCAL_DIR` to read another directory. Production
 * builds have no local source: pull requests publish their own data.
 */
function localReport(): Plugin {
	// Browser tests review a small committed report through the same route.
	const defaultDirectory = process.env.VITEST
		? './src/test/fixtures/report'
		: '../../.artifacts/visual-regression';
	const directory = path.resolve(
		process.env.VISUAL_REVIEW_LOCAL_DIR ??
			fileURLToPath(new URL(defaultDirectory, import.meta.url)),
	);
	return {
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use(LOCAL_REPORT_ROUTE, (request, response, next) => {
				const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
				if (!LOCAL_REPORT_FILE_PATTERN.test(pathname)) {
					response.statusCode = 404;
					response.end();
					return;
				}
				const file = path.join(directory, pathname);
				stat(file)
					.then((stats) => {
						response.setHeader(
							'Content-Type',
							pathname.endsWith('.json') ? 'application/json' : 'image/png',
						);
						response.setHeader('Content-Length', stats.size);
						response.setHeader('Cache-Control', 'no-store');
						createReadStream(file).on('error', next).pipe(response);
					})
					.catch(() => {
						response.statusCode = 404;
						response.end();
					});
			});
		},
		name: 'visual-review-local-report',
	};
}

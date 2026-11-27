import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type * as ThemeCompiler from '@luke-ui/react/theme/compiler';
import { stat } from 'node:fs/promises';
import type { Plugin } from 'vite-plus';
import { fixtureReportFiles } from './src/test/fixture-report.js';
import { visualReviewThemeInput } from './src/theme/input.js';

// Plugins shared by the app build in `vite.config.ts` and the tests in `vitest.config.ts`.

const LOCAL_REPORT_ROUTE = '/__local-report';
const LOCAL_REPORT_FILE_PATTERN =
	/^\/(?:summary\.json|diff\/[a-z0-9-]+\/[a-z0-9-]+\.(?:expected|actual|diff)\.png)$/;

/**
 * Serves a local comparison at `/__local-report` while developing, so `?source=local` reviews the
 * output of `pnpm test:visual`. Set `VISUAL_REVIEW_LOCAL_DIR` to read another directory. Production
 * builds have no local source: pull requests publish their own data.
 */
export function localReport(): Plugin {
	// Browser tests always review the small report drawn in `src/test`, through the same route.
	const fixture = process.env.VITEST ? fixtureReportFiles() : undefined;
	const directory = path.resolve(
		process.env.VISUAL_REVIEW_LOCAL_DIR ??
			fileURLToPath(new URL('../../.artifacts/visual-regression', import.meta.url)),
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
				const contentType = pathname.endsWith('.json') ? 'application/json' : 'image/png';
				response.setHeader('Cache-Control', 'no-store');
				if (fixture) {
					const body = fixture.get(pathname);
					response.statusCode = body ? 200 : 404;
					if (body) response.setHeader('Content-Type', contentType);
					response.end(body);
					return;
				}
				const file = path.join(directory, pathname);
				stat(file)
					.then((stats) => {
						response.setHeader('Content-Type', contentType);
						response.setHeader('Content-Length', stats.size);
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

/**
 * Serves the app theme as `virtual:visual-review-theme.css`. Vite restarts when `src/theme/input.ts`
 * changes because it is a config dependency.
 */
export function visualReviewTheme(): Plugin {
	const id = 'virtual:visual-review-theme.css';
	const resolvedId = `\0${id}`;
	return {
		async load(loadId) {
			if (loadId !== resolvedId) return;
			const compiler = new URL(import.meta.resolve('@luke-ui/react/theme/compiler'));
			this.addWatchFile(fileURLToPath(compiler));
			// Refresh Node's cached compiler when the workspace build changes.
			compiler.search = `build=${randomUUID()}`;
			const { defineTheme }: typeof ThemeCompiler = await import(compiler.href);
			return defineTheme(visualReviewThemeInput);
		},
		name: 'visual-review-theme',
		resolveId: (source) => (source === id ? resolvedId : undefined),
	};
}

import { cpSync, createReadStream, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Plugin } from 'vite-plus';
import { TYPE_DEFINITIONS_DIR } from './type-definition-model.js';

const URL_PREFIX = `/${TYPE_DEFINITIONS_DIR}/`;

/**
 * Serves MDX-emitted definition JSON from `.source/type-definitions` in dev and copies it into the
 * client build output so deferred fetches resolve at `/type-definitions/…`.
 */
export function typeDefinitionsAssetsPlugin(options: { docsRoot: string }): Plugin {
	const assetsDir = resolve(options.docsRoot, '.source', TYPE_DEFINITIONS_DIR);

	return {
		name: 'luke-type-definitions-assets',
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const url = req.url ?? '';
				if (!url.startsWith(URL_PREFIX)) {
					next();
					return;
				}

				const relativePath = decodeURIComponent(url.slice(URL_PREFIX.length).split('?')[0] ?? '');
				if (
					relativePath.length === 0 ||
					relativePath.includes('..') ||
					relativePath.includes('/')
				) {
					res.statusCode = 404;
					res.end();
					return;
				}

				const filePath = join(assetsDir, relativePath);
				if (!existsSync(filePath)) {
					res.statusCode = 404;
					res.end();
					return;
				}

				res.setHeader('Content-Type', 'application/json; charset=utf-8');
				createReadStream(filePath).pipe(res);
			});
		},
		writeBundle(outputOptions) {
			const outDir = outputOptions.dir;
			if (outDir === undefined || !existsSync(assetsDir)) return;
			// TanStack Start emits client and SSR bundles; only the client tree serves static JSON.
			if (!outDir.replaceAll('\\', '/').endsWith('/client')) return;

			const targetDir = join(outDir, TYPE_DEFINITIONS_DIR);
			rmSync(targetDir, { recursive: true, force: true });
			cpSync(assetsDir, targetDir, { recursive: true });
		},
	};
}

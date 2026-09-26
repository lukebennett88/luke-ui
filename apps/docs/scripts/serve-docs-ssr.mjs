/**
 * Minimal Netlify-like host for a built docs app: serve files from `dist/client`
 * when they exist (`preferStatic`), otherwise forward to `dist/server` `fetch`.
 */
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFile, stat } from 'node:fs/promises';

const MIME_TYPES = {
	'.css': 'text/css; charset=utf-8',
	'.html': 'text/html; charset=utf-8',
	'.ico': 'image/x-icon',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.md': 'text/markdown; charset=utf-8',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.txt': 'text/plain; charset=utf-8',
	'.woff2': 'font/woff2',
	'.xml': 'application/xml; charset=utf-8',
};

/**
 * @param {string} docsAppRoot
 * @param {{ host?: string; port?: number }} [options]
 */
export async function startDocsSsrServer(docsAppRoot, options = {}) {
	const host = options.host ?? '127.0.0.1';
	const port = options.port ?? 0;
	const clientDir = resolve(docsAppRoot, 'dist/client');
	const serverEntryUrl = pathToFileURL(resolve(docsAppRoot, 'dist/server/server.js')).href;
	const serverModule = await import(serverEntryUrl);
	const fetchHandler = serverModule.default?.fetch;

	if (typeof fetchHandler !== 'function') {
		throw new Error('docs dist/server/server.js must default-export `{ fetch }`');
	}

	const server = createServer((req, res) => {
		void handleRequest(req, res, clientDir, fetchHandler);
	});

	await new Promise((resolveListen, rejectListen) => {
		server.once('error', rejectListen);
		server.listen(port, host, () => {
			server.off('error', rejectListen);
			resolveListen(undefined);
		});
	});

	const address = server.address();
	if (!address || typeof address === 'string') {
		server.close();
		throw new Error('docs SSR server failed to bind a TCP port');
	}

	return {
		close: () =>
			new Promise((resolveClose, rejectClose) => {
				server.close((error) => {
					if (error) rejectClose(error);
					else resolveClose(undefined);
				});
			}),
		origin: `http://${host}:${address.port}`,
	};
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} clientDir
 * @param {(request: Request) => Promise<Response>} fetchHandler
 */
async function handleRequest(req, res, clientDir, fetchHandler) {
	try {
		const url = new URL(req.url || '/', 'http://127.0.0.1');
		const relativePath = decodeURIComponent(url.pathname);
		const candidate = join(clientDir, relativePath === '/' ? '' : relativePath);

		if (await tryServeStaticFile(candidate, res)) return;

		const headers = new Headers();
		for (const [name, value] of Object.entries(req.headers)) {
			if (value === undefined) continue;
			headers.set(name, Array.isArray(value) ? value.join(', ') : value);
		}

		const request = new Request(url, {
			headers,
			method: req.method,
		});
		const response = await fetchHandler(request);
		const responseHeaders = Object.fromEntries(response.headers);
		res.writeHead(response.status, responseHeaders);
		res.end(Buffer.from(await response.arrayBuffer()));
	} catch (error) {
		res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
		res.end(error instanceof Error ? error.stack || error.message : String(error));
	}
}

/**
 * @param {string} filePath
 * @param {import('node:http').ServerResponse} res
 */
async function tryServeStaticFile(filePath, res) {
	try {
		const fileStat = await stat(filePath);
		if (!fileStat.isFile()) return false;
		const body = await readFile(filePath);
		res.writeHead(200, {
			'content-type': MIME_TYPES[extname(filePath)] || 'application/octet-stream',
		});
		res.end(body);
		return true;
	} catch {
		return false;
	}
}

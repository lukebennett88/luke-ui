import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(scriptDir, '../dist');
const serverEntryPath = resolve(distDir, 'server/server.js');
const outputPath = resolve(distDir, 'client/404.html');

/**
 * Cloudflare Pages serves a top-level `404.html` with status 404 for a
 * missing path. Without one, Pages falls back to `index.html` as an SPA,
 * so a genuinely missing path would render the homepage with status 200.
 * This asks the built SSR handler for its own not-found page and writes the
 * response as that static file.
 */
async function writeNotFoundPage(): Promise<void> {
	const { default: server } = await import(serverEntryPath);
	const base = process.env.VITE_BASE_URL || '/';
	const url = new URL(`${base}404`, 'http://localhost');
	const res: Response = await server.fetch(new Request(url, { headers: { Accept: 'text/html' } }));

	if (res.status !== 404) {
		throw new Error(`Expected the not-found page to respond with 404, got ${res.status}.`);
	}
	const contentType = res.headers.get('Content-Type') ?? '';
	if (!contentType.startsWith('text/html')) {
		throw new Error(`Expected the not-found page to be text/html, got "${contentType}".`);
	}

	writeFileSync(outputPath, await res.text());
}

await writeNotFoundPage();

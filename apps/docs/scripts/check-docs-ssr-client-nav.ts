/**
 * Production SSR regression: after a Netlify-mode docs build (DOCS_STATIC unset),
 * client-side navigation between docs pages must not fetch missing
 * `__tsr/staticServerFnCache/*.json` files.
 *
 * Requires a prior `pnpm --filter docs run build` with DOCS_STATIC unset.
 */
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startDocsSsrServer } from './serve-docs-ssr.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const docsAppRoot = resolve(scriptDir, '..');
const clientDir = resolve(docsAppRoot, 'dist/client');
const serverEntry = resolve(docsAppRoot, 'dist/server/server.js');

const START_PATH = '/docs/installation';
const NEXT_PATH = '/docs/styling';
const STATIC_CACHE_PATH_PATTERN = /\/__tsr\/staticServerFnCache\//;

function fail(message: string): never {
	console.error(`check:ssr-nav: ${message}`);
	process.exit(1);
}

if (!existsSync(clientDir) || !existsSync(serverEntry)) {
	fail(`no SSR build at dist/. Run "pnpm --filter docs run build" with DOCS_STATIC unset first.`);
}

if (existsSync(resolve(clientDir, 'docs/installation/index.html'))) {
	fail(
		'dist/client contains prerendered docs HTML. Rebuild without DOCS_STATIC so this check covers Netlify SSR.',
	);
}

const server = await startDocsSsrServer(docsAppRoot);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const consoleErrors: Array<string> = [];
const pageErrors: Array<string> = [];
const failedStaticCacheUrls: Array<string> = [];

page.on('console', (message) => {
	if (message.type() === 'error') {
		consoleErrors.push(message.text());
	}
});
page.on('pageerror', (error) => {
	pageErrors.push(error instanceof Error ? error.message : String(error));
});
page.on('response', (response) => {
	if (STATIC_CACHE_PATH_PATTERN.test(response.url()) && response.status() >= 400) {
		failedStaticCacheUrls.push(`${response.status()} ${response.url()}`);
	}
});

try {
	await page.goto(`${server.origin}${START_PATH}`, { waitUntil: 'networkidle' });

	const startTitle = await page.title();
	if (!/installation/i.test(startTitle)) {
		fail(`expected Installation page title, got "${startTitle}"`);
	}

	const nextLink = page.locator(`a[href="${NEXT_PATH}"]`).first();
	await nextLink.click();
	await page.waitForURL((url) => url.pathname === NEXT_PATH, { timeout: 15_000 });
	await page.getByRole('heading', { level: 1, name: 'Styling' }).waitFor({ timeout: 15_000 });

	const nextTitle = await page.title();
	if (!/styling/i.test(nextTitle)) {
		fail(`client navigation did not render Styling; title was "${nextTitle}"`);
	}

	if (failedStaticCacheUrls.length > 0) {
		fail(
			`static server-fn cache requests failed (SSR builds must not use staticFunctionMiddleware):\n${failedStaticCacheUrls.join('\n')}`,
		);
	}

	const jsonParseErrors = [...consoleErrors, ...pageErrors].filter((message) =>
		/unexpected token|is not valid json|staticserverfncache/i.test(message),
	);
	if (jsonParseErrors.length > 0) {
		fail(`console/page errors during client navigation:\n${jsonParseErrors.join('\n')}`);
	}

	console.log(
		`check:ssr-nav: client navigation ${START_PATH} → ${NEXT_PATH} succeeded without staticServerFnCache fetches.`,
	);
} finally {
	await browser.close();
	await server.close();
}

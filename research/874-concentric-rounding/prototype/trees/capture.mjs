/* oxlint-disable no-await-in-loop, no-console -- a sequential command-line script */
/**
 * Captures box-geometry skeletons of rendered pages as JSON trees, plus a README of statistics.
 *
 * Usage (from the repo root, after `pnpm run build:reference-app` and `pnpm run build:docs`):
 *   node research/874-concentric-rounding/prototype/trees/capture.mjs
 *
 * Serves apps/reference-app/dist (SPA fallback) and apps/docs/dist/client (static, 404.html
 * fallback) on ephemeral ports, opens each page in Chromium at 1280x900, and writes
 * `<name>.json` and `README.md` next to this file. Playwright is resolved from
 * packages/@luke-ui/react/node_modules.
 *
 * Node schema: { p: [t,r,b,l]?, r?: radius, b?: border, bg?: 1, k?: children }.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(here, '../../../..');
const require = createRequire(join(root, 'packages/@luke-ui/react/package.json'));
const { chromium } = require('playwright');

const types = {
	'.css': 'text/css',
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.json': 'application/json',
	'.md': 'text/markdown',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.woff2': 'font/woff2',
};

function serve(dir, spa) {
	const server = createServer((req, res) => {
		const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
		let file = join(dir, path);
		if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
		let status = 200;
		if (!existsSync(file) || !statSync(file).isFile()) {
			file = join(dir, spa ? 'index.html' : '404.html');
			status = spa ? 200 : 404;
		}
		res.writeHead(status, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
		res.end(readFileSync(file));
	});
	return new Promise((done) => {
		server.listen(0, '127.0.0.1', () => done({ port: server.address().port, server }));
	});
}

/** Runs in the page: serialise document.body. */
function serialise(el = document.body) {
	const cs = getComputedStyle(el);
	if (cs.display === 'none') return null;
	const node = {};
	const p = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map((v) =>
		Math.round(Number.parseFloat(v) || 0),
	);
	if (p.some(Boolean)) node.p = p;
	const rawRadius = cs.borderTopLeftRadius.split(' ')[0];
	const r = Math.min(9999, Math.round(Number.parseFloat(rawRadius) || 0));
	if (r) node.r = r;
	const b = cs.borderTopStyle === 'none' ? 0 : Number.parseFloat(cs.borderTopWidth) || 0;
	if (b) node.b = b;
	const m = cs.backgroundColor.match(/[\d.]+/g);
	let alpha = cs.backgroundColor === 'transparent' ? 0 : 1;
	if (m && m.length >= 4) alpha = Number.parseFloat(m[3]);
	if (alpha > 0) node.bg = 1;
	if (el.tagName.toLowerCase() !== 'svg') {
		const k = [];
		for (const c of el.children) {
			const t = c.tagName.toLowerCase();
			if (t === 'script' || t === 'style') continue;
			const s = serialise(c);
			if (s) k.push(s);
		}
		if (k.length > 0) node.k = k;
	}
	return node;
}

function stats(tree) {
	const s = { total: 0, padded: 0, radius: 0, nestedRadius: 0, paddedBetween: 0, maxDepth: 0 };
	/** @param ancestors radius-flags along the chain */
	function visit(n, depth, chain) {
		s.total++;
		s.maxDepth = Math.max(s.maxDepth, depth);
		if (n.p) s.padded++;
		const hasR = Boolean(n.r);
		if (hasR) {
			s.radius++;
			if (chain.some(Boolean)) s.nestedRadius++;
		}
		const outer = chain.some(Boolean);
		// "between" requires a radius ancestor and a radius descendant.
		n.hasRadiusDesc = false;
		const childChain = [...chain, hasR];
		for (const c of n.k ?? []) {
			visit(c, depth + 1, childChain);
			if (c.hasRadiusDesc || c.r) n.hasRadiusDesc = true;
		}
		if (n.p && !hasR && outer && n.hasRadiusDesc) s.paddedBetween++;
		delete n.hasRadiusDesc;
	}
	visit(tree, 1, []);
	return s;
}

const ref = await serve(join(root, 'apps/reference-app/dist'), true);
const docs = await serve(join(root, 'apps/docs/dist/client'), false);
const refUrl = (p) => `http://127.0.0.1:${ref.port}${p}`;
const docsUrl = (p) => `http://127.0.0.1:${docs.port}${p}`;

const pages = [
	{
		name: 'reference-preferences',
		route: '/settings/preferences',
		how: 'direct load, wait for settings to render',
		url: refUrl('/settings/preferences'),
		ready: (page) => page.getByRole('heading', { level: 1 }).first().waitFor(),
	},
	{
		name: 'reference-profile',
		route: '/settings/profile',
		how: 'direct load, wait for profile form',
		url: refUrl('/settings/profile'),
		ready: (page) => page.getByLabel('Full name').first().waitFor(),
	},
	{
		name: 'reference-email-dialog',
		route: '/settings/profile',
		how: 'profile page, clicked the "Change email" button to open the modal dialog',
		url: refUrl('/settings/profile'),
		ready: async (page) => {
			await page.getByRole('button', { name: 'Change email' }).click();
			await page.getByRole('dialog').waitFor();
		},
	},
	{
		name: 'reference-security',
		route: '/settings/security',
		how: 'direct load, wait for heading',
		url: refUrl('/settings/security'),
		ready: (page) => page.getByRole('heading', { level: 1 }).first().waitFor(),
	},
	{
		name: 'docs-home',
		route: '/',
		how: 'prerendered docs home page',
		url: docsUrl('/'),
		ready: (page) => page.locator('h1').first().waitFor(),
	},
	{
		name: 'docs-button',
		route: '/components/actions/button/',
		how: 'prerendered Button component page (many examples)',
		url: docsUrl('/components/actions/button/'),
		ready: (page) => page.locator('h1').first().waitFor(),
	},
];

const sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root }).toString().trim();
const browser = await chromium.launch();
const rows = [];
for (const spec of pages) {
	const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
	const page = await context.newPage();
	await page.goto(spec.url, { waitUntil: 'networkidle' });
	await spec.ready(page);
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(800);
	const tree = await page.evaluate(serialise);
	writeFileSync(join(here, `${spec.name}.json`), JSON.stringify(tree));
	const s = stats(tree);
	rows.push({ ...spec, s });
	console.log(spec.name, s);
	await context.close();
}
await browser.close();
ref.server.close();
docs.server.close();

const lines = [
	'# Captured DOM skeletons',
	'',
	`Captured at commit \`${sha}\` by \`capture.mjs\` (viewport 1280x900, Chromium).`,
	'Schema: `{p?:[t,r,b,l], r?:radius, b?:border, bg?:1, k?:children}`.',
	'',
	'"Padded between radius" = elements with padding and no radius that have a radius ancestor and a radius descendant.',
	'',
	'| File | Route | How reached | Elements | Padded | Radius | Nested radius | Padded between radius | Max depth |',
	'| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |',
	...rows.map(
		({ name, route, how, s }) =>
			`| ${name}.json | \`${route}\` | ${how} | ${s.total} | ${s.padded} | ${s.radius} | ${s.nestedRadius} | ${s.paddedBetween} | ${s.maxDepth} |`,
	),
	'',
];
writeFileSync(join(here, 'README.md'), lines.join('\n'));

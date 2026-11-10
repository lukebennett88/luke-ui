/* eslint-disable no-await-in-loop, no-console -- A command-line script: it reports to the terminal and runs builds and browser steps one at a time. */
// Checks the dev server path and a misconfigured StyleX consumer.
//
//   node verify/dev-and-misconfig.mjs
//
// 1. `vite` dev for the VE consumer and the StyleX source consumer: the page renders styled, with
//    no console errors, and the Save button paints the same fill as the production build.
// 2. The StyleX source consumer built without the StyleX plugin: what the build and the page do.
import { execFileSync, spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const spikeRoot = fileURLToPath(new URL('..', import.meta.url));
const contentTypes = { '.css': 'text/css', '.js': 'text/javascript' };
const results = {};

function startDev(variant, port) {
	const dir = join(spikeRoot, 'consumers', variant);
	const child = spawn(
		join(dir, 'node_modules', '.bin', 'vite'),
		['--port', String(port), '--strictPort'],
		{
			cwd: dir,
			env: { ...process.env, APP: 'realistic' },
		},
	);
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error(`${variant} dev server did not start`)), 30000);
		child.stdout.on('data', (data) => {
			if (String(data).includes('Local')) {
				clearTimeout(timer);
				resolve(child);
			}
		});
	});
}

const browser = await chromium.launch();
for (const [variant, port] of [
	['ve', 5301],
	['stylex-source', 5302],
]) {
	const server = await startDev(variant, port);
	const page = await browser.newPage();
	const errors = [];
	page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
	page.on('pageerror', (error) => errors.push(String(error)));
	const start = Date.now();
	await page.goto(`http://localhost:${port}/`);
	const save = page.getByRole('button', { name: 'Save changes' });
	await save.waitFor();
	await page.waitForTimeout(500);
	results[`dev ${variant}`] = {
		consoleErrors: errors,
		firstLoadMs: Date.now() - start,
		saveBackground: await save.evaluate((element) => getComputedStyle(element).backgroundColor),
		saveBlockSize: await save.evaluate((element) => getComputedStyle(element).blockSize),
	};
	await page.close();
	server.kill();
}
await browser.close();

const dir = join(spikeRoot, 'consumers', 'stylex-source');
try {
	execFileSync(
		join(dir, 'node_modules', '.bin', 'vite'),
		['build', '--outDir', 'dist/misconfigured', '--logLevel', 'error'],
		{
			cwd: dir,
			env: { ...process.env, APP: 'minimal', SPIKE_OMIT_STYLEX: '1' },
			stdio: 'pipe',
		},
	);
	results['build without plugin'] = 'build succeeded';
	const misconfigured = await chromium.launch();
	const page = await misconfigured.newPage();
	const errors = [];
	page.on('pageerror', (error) => errors.push(String(error)));
	const { createServer } = await import('node:http');
	const { readFileSync } = await import('node:fs');
	const server = createServer((request, response) => {
		const file = join(
			dir,
			'dist',
			'misconfigured',
			request.url === '/' ? 'index.html' : request.url,
		);
		try {
			response.writeHead(200, {
				'content-type': contentTypes[extname(file)] ?? 'text/html',
			});
			response.end(readFileSync(file));
		} catch {
			response.writeHead(404).end();
		}
	}).listen(5303);
	await page.goto('http://localhost:5303/');
	await page.waitForTimeout(1000);
	results['page without plugin'] = errors;
	server.close();
	await misconfigured.close();
} catch (error) {
	results['build without plugin'] = String(error.stderr ?? error.message)
		.split('\n')
		.slice(0, 6)
		.join('\n');
}

writeFileSync(
	join(spikeRoot, 'verify', 'dev-and-misconfig.json'),
	`${JSON.stringify(results, null, '\t')}\n`,
);
console.log(JSON.stringify(results, null, '\t'));

/* oxlint-disable no-await-in-loop, no-console -- a sequential command-line script that reports to the terminal */
// Builds the prototype in several configurations and measures stylesheet bytes and style cost.
//
//   node measure.mjs [engine...]     # default: chromium firefox webkit
//
// Writes `results/measurements.json` and `results/measurements.md`. Timings are medians from one
// machine, so read them as ratios.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import playwright from 'playwright';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = join(root, 'dist-measure');
const engines = process.argv.slice(2).length
	? process.argv.slice(2)
	: ['chromium', 'firefox', 'webkit'];

const configurations = [
	{ env: { CONCENTRIC_QUERY: '0' }, name: 'Proposed: gated, 4 levels', perf: true },
	{
		env: { CONCENTRIC_HAS: '0', CONCENTRIC_QUERY: '0' },
		name: 'Ungated: every Box publishes',
		perf: true,
	},
	{ env: { CONCENTRIC_DEPTH: '2', CONCENTRIC_QUERY: '0' }, name: 'Gated, 2 levels' },
	{ env: { CONCENTRIC_DEPTH: '8', CONCENTRIC_QUERY: '0' }, name: 'Gated, 8 levels' },
	{
		env: { CONCENTRIC_QUERY: '0', CONCENTRIC_REGISTER_INPUTS: '0' },
		name: 'Gated, unregistered inputs',
	},
	{ env: { CONCENTRIC_DEPTH: '1' }, name: 'Style-query alternation only' },
];

const types = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript' };
const server = createServer((request, response) => {
	const path = new URL(request.url, 'http://x').pathname;
	try {
		const body = readFileSync(join(outDir, path));
		response.writeHead(200, { 'content-type': types[extname(path)] }).end(body);
	} catch {
		response.writeHead(404).end();
	}
});
await new Promise((resolve) => server.listen(0, resolve));
const origin = `http://localhost:${server.address().port}`;

const median = (values) => values.toSorted((a, b) => a - b)[values.length >> 1];
const css = (prefix) => {
	const assets = readdirSync(join(outDir, 'assets'));
	const file = assets.find((name) => name.startsWith(prefix) && name.endsWith('.css'));
	const body = readFileSync(join(outDir, 'assets', file));
	return { gzip: gzipSync(body, { level: 9 }).length, raw: body.length };
};

async function time(browser, path) {
	const runs = [];
	for (let index = 0; index < 3; index++) {
		const page = await browser.newPage({ viewport: { height: 900, width: 1100 } });
		await page.goto(origin + path);
		await page.waitForFunction(() => window.runPerf);
		runs.push(await page.evaluate(() => window.runPerf()));
		await page.close();
	}
	return {
		inlineProperties: runs[0].inlineProperties,
		mountMs: median(runs.map((run) => run.mountMs)),
		restyleMs: median(runs.map((run) => run.restyleMs)),
	};
}

const results = [];
for (const configuration of configurations) {
	rmSync(outDir, { force: true, recursive: true });
	execFileSync(join(root, 'node_modules/.bin/vp'), ['build'], {
		cwd: root,
		env: { ...process.env, ...configuration.env, OUT_DIR: outDir },
		stdio: 'ignore',
	});
	const baseline = css('main-baseline');
	const concentric = css('main-concentric');
	const entry = {
		css: { addedGzip: concentric.gzip - baseline.gzip, addedRaw: concentric.raw - baseline.raw },
		name: configuration.name,
	};
	if (configuration.perf) {
		entry.perf = {};
		for (const engine of engines) {
			const browser = await playwright[engine].launch();
			entry.perf[engine] = {
				baseline: await time(browser, '/perf-baseline.html'),
				context: await time(browser, '/perf-baseline.html?context'),
				unused: await time(browser, '/perf-concentric.html?inner=control'),
				used: await time(browser, '/perf-concentric.html'),
			};
			await browser.close();
		}
	}
	results.push(entry);
	console.log(JSON.stringify(entry));
}
rmSync(outDir, { force: true, recursive: true });
server.close();

const lines = [
	'| Configuration | Added CSS | Added CSS, gzip |',
	'| --- | --- | --- |',
	...results.map(
		(entry) => `| ${entry.name} | ${entry.css.addedRaw} B | ${entry.css.addedGzip} B |`,
	),
	'',
	'8,000 Boxes with geometry. Mount / theme-switch restyle, ms:',
	'',
	'| Configuration | Engine | Today | Feature built, unused | Feature used on 6,000 | Context on every Box |',
	'| --- | --- | --- | --- | --- | --- |',
];
const cell = (run) => `${run.mountMs.toFixed(0)} / ${run.restyleMs.toFixed(1)}`;
for (const entry of results.filter((item) => item.perf)) {
	for (const [engine, run] of Object.entries(entry.perf)) {
		lines.push(
			`| ${entry.name} | ${engine} | ${cell(run.baseline)} | ${cell(run.unused)} | ${cell(run.used)} | ${cell(run.context)} |`,
		);
	}
}
writeFileSync(
	join(root, 'results', 'measurements.json'),
	`${JSON.stringify(results, null, '\t')}\n`,
);
writeFileSync(join(root, 'results', 'measurements.md'), `${lines.join('\n')}\n`);
console.log(lines.join('\n'));

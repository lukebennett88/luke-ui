/* oxlint-disable no-await-in-loop, no-console -- a sequential command-line script that reports to the terminal */
// Builds the prototype in several configurations. For each it records the stylesheet bytes the
// feature adds and which fixture cases fail. For the main ones it also replays captured pages
// (`trees/`) and times style work.
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
import { measure } from './checks.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = join(root, 'dist-measure');
const engines = process.argv.slice(2).length
	? process.argv.slice(2)
	: ['chromium', 'firefox', 'webkit'];

// Selector-level alternation, the first round's design, was measured at 4e9eef1d. Its builder was
// removed when the style query became the decision, so it is not rebuilt here.
const configurations = [
	{ env: {}, name: 'Decided design', perf: 'proposed' },
	{ env: { CONCENTRIC_HAS: '0' }, name: 'Without the `:has()` gate', perf: 'ungated' },
	{
		env: { CONCENTRIC_STYLE_QUERY: '0' },
		name: 'What a browser without container style queries applies',
	},
	{ env: { CONCENTRIC_REGISTER_INPUTS: '0' }, name: 'With unregistered inputs' },
];
const trees = [
	'reference-security',
	'reference-profile',
	'reference-preferences',
	'reference-email-dialog',
	'docs-home',
	'docs-button',
	'stress',
];

const types = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript' };
const server = createServer((request, response) => {
	const path = new URL(request.url, 'http://x').pathname;
	try {
		const body = readFileSync(join(path.startsWith('/trees/') ? root : outDir, path));
		response.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/json' });
		response.end(body);
	} catch {
		response.writeHead(404).end();
	}
});
await new Promise((resolve) => server.listen(0, resolve));
const origin = `http://localhost:${server.address().port}`;

const css = (prefix) => {
	const assets = readdirSync(join(outDir, 'assets'));
	const file = assets.find((name) => name.startsWith(prefix) && name.endsWith('.css'));
	const body = readFileSync(join(outDir, 'assets', file));
	return { gzip: gzipSync(body, { level: 9 }).length, raw: body.length };
};

async function time(browser, page, tree, adopt) {
	const tab = await browser.newPage({ viewport: { height: 900, width: 1280 } });
	await tab.goto(`${origin}/perf-${page}.html`);
	await tab.waitForFunction(() => window.runPerf);
	const result = await tab.evaluate(([name, flag]) => window.runPerf(name, flag), [tree, adopt]);
	await tab.close();
	return result;
}

const results = [];
const perf = {};
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
		failing: {},
		name: configuration.name,
	};
	for (const engine of engines) {
		const browser = await playwright[engine].launch();
		const page = await browser.newPage({ viewport: { height: 1400, width: 1100 } });
		await page.goto(`${origin}/concentric.html`);
		await page.waitForFunction(() => window.report?.ready);
		const { checks } = await page.evaluate(measure);
		entry.failing[engine] = checks.filter((check) => !check.pass).map((check) => check.id);
		await page.close();

		if (configuration.perf) {
			perf[engine] ??= {};
			for (const tree of trees) {
				const row = (perf[engine][tree] ??= {});
				row.today ??= await time(browser, 'baseline', tree, false);
				row[`${configuration.perf}Unused`] = await time(browser, 'concentric', tree, false);
				row[`${configuration.perf}Adopted`] = await time(browser, 'concentric', tree, true);
			}
		}
		await browser.close();
	}
	results.push(entry);
	console.log(JSON.stringify(entry));
}
rmSync(outDir, { force: true, recursive: true });
server.close();

const lines = [
	'| Configuration | Added CSS | Added CSS, gzip | Fixture cases that fail |',
	'| --- | --- | --- | --- |',
	...results.map((entry) => {
		const failing = [...new Set(Object.values(entry.failing).flat())];
		return `| ${entry.name} | ${entry.css.addedRaw} B | ${entry.css.addedGzip} B | ${failing.join(', ') || 'none'} |`;
	}),
];
const columns = [
	['today', 'Today'],
	['proposedUnused', 'Proposed, unused'],
	['proposedAdopted', 'Proposed, adopted'],
	['ungatedUnused', 'Ungated, unused'],
	['ungatedAdopted', 'Ungated, adopted'],
];
const operations = [
	['mountMs', 'Mount'],
	['restyleMs', 'Theme switch'],
	['insertMs', 'Insert and remove a rounded subtree'],
	['toggleMs', 'Unrelated state change on one element'],
];
for (const [key, title] of operations) {
	lines.push(
		'',
		`${title}, ms:`,
		'',
		`| Engine | Page | Elements | Concentric when adopted | ${columns.map(([, label]) => label).join(' | ')} |`,
		`| --- | --- | --- | --- | ${columns.map(() => '---').join(' | ')} |`,
	);
	for (const [engine, pages] of Object.entries(perf)) {
		for (const [tree, row] of Object.entries(pages)) {
			const cells = columns.map(([column]) => row[column][key].toFixed(3));
			lines.push(
				`| ${engine} | ${tree} | ${row.today.elements} | ${row.proposedAdopted.concentric} | ${cells.join(' | ')} |`,
			);
		}
	}
}
writeFileSync(
	join(root, 'results', 'measurements.json'),
	`${JSON.stringify({ configurations: results, perf }, null, '\t')}\n`,
);
writeFileSync(join(root, 'results', 'measurements.md'), `${lines.join('\n')}\n`);
console.log(lines.join('\n'));

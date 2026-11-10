/* eslint-disable no-await-in-loop, no-console -- A command-line script: it reports to the terminal and runs builds and browser steps one at a time. */
// Builds every consumer variant for every app and records what a browser downloads.
//
//   node bench/run.mjs [--runs 3]
//   node bench/run.mjs --report-only   (rewrites results.md from results.json)
//
// Writes `bench/results.json` and `bench/results.md`. Every number is a production client build of
// the same app source. CSS is reported with and without the theme stylesheets, which are the same
// generated CSS in every variant. Gzip uses level 9.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { parse } from 'postcss';

const spikeRoot = fileURLToPath(new URL('..', import.meta.url));
const consumers = join(spikeRoot, 'consumers');
const runsArg = process.argv.indexOf('--runs');
const runs = runsArg === -1 ? 3 : Number(process.argv[runsArg + 1]);

const variants = ['ve', 've-optimised', 'stylex-precompiled', 'stylex-split', 'stylex-source'];
const apps = ['minimal', 'minimal-barrel', 'realistic'];

const gzip = (text) => gzipSync(text, { level: 9 }).length;
const median = (values) => values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)];

/** Drops the theme rules, which every variant shares, so library CSS can be compared directly. */
function withoutThemes(css) {
	const root = parse(css);
	root.walkRules((rule) => {
		if (rule.selector.includes('luke-ui-theme-')) rule.remove();
	});
	root.walkAtRules((atRule) => {
		if (atRule.nodes && atRule.nodes.length === 0) atRule.remove();
	});
	return root.toString();
}

function assets(dir, extension) {
	const assetsDir = join(dir, 'assets');
	return readdirSync(assetsDir)
		.filter((file) => file.endsWith(extension))
		.map((file) => readFileSync(join(assetsDir, file), 'utf8'))
		.join('\n');
}

const reportOnly = process.argv.includes('--report-only');
const results = reportOnly
	? JSON.parse(readFileSync(join(spikeRoot, 'bench', 'results.json'), 'utf8')).results
	: [];
for (const variant of reportOnly ? [] : variants) {
	const dir = join(consumers, variant);
	const vite = join(dir, 'node_modules', '.bin', 'vite');
	for (const app of apps) {
		const times = [];
		for (let run = 0; run < runs; run += 1) {
			rmSync(join(dir, 'node_modules', '.vite'), { force: true, recursive: true });
			rmSync(join(dir, 'dist', app), { force: true, recursive: true });
			const start = performance.now();
			execFileSync(vite, ['build', '--logLevel', 'error'], {
				cwd: dir,
				env: { ...process.env, APP: app },
			});
			times.push(performance.now() - start);
		}
		const out = join(dir, 'dist', app);
		const js = assets(out, '.js');
		const css = assets(out, '.css');
		const libraryCss = withoutThemes(css);
		results.push({
			app,
			buildMs: Math.round(median(times)),
			css: { gzip: gzip(css), raw: css.length },
			// A selector or property only the Combobox uses: present means unused-component CSS shipped.
			hasComboboxCss: /--trigger-width/.test(css),
			js: { gzip: gzip(js), raw: js.length },
			libraryCss: { gzip: gzip(libraryCss), raw: libraryCss.length },
			total: { gzip: gzip(js) + gzip(css), raw: js.length + css.length },
			variant,
		});
		console.log(`${variant} ${app}: ${JSON.stringify(results.at(-1))}`);
	}
}

// Server render time for the realistic app, as a proxy for per-render style resolution cost.
for (const variant of reportOnly ? [] : variants) {
	const dir = join(consumers, variant);
	execFileSync('node', ['../build-app.mjs', 'realistic'], { cwd: dir, stdio: 'ignore' });
	const { render } = await import(
		pathToFileURL(join(dir, 'dist', 'realistic-ssr', 'server.js')).href
	);
	for (let index = 0; index < 50; index += 1) render();
	const samples = [];
	for (let batch = 0; batch < 5; batch += 1) {
		const start = performance.now();
		for (let index = 0; index < 100; index += 1) render();
		samples.push((performance.now() - start) / 100);
	}
	const html = render();
	const entry = results.find((result) => result.variant === variant && result.app === 'realistic');
	entry.ssrRenderMs = Number(median(samples).toFixed(3));
	entry.html = { gzip: gzip(html), raw: html.length };
	entry.classAttributeBytes = [...html.matchAll(/class="([^"]*)"/g)].reduce(
		(sum, match) => sum + match[1].length,
		0,
	);
}

if (!reportOnly)
	writeFileSync(
		join(spikeRoot, 'bench', 'results.json'),
		`${JSON.stringify({ runs, results }, null, '\t')}\n`,
	);

const kb = (bytes) => (bytes / 1024).toFixed(1);
const rows = results.map((result) => {
	return `| ${result.variant} | ${result.app} | ${kb(result.js.raw)} / ${kb(result.js.gzip)} | ${kb(result.css.raw)} / ${kb(result.css.gzip)} | ${kb(result.libraryCss.raw)} / ${kb(result.libraryCss.gzip)} | ${kb(result.total.raw)} / ${kb(result.total.gzip)} | ${result.hasComboboxCss ? 'yes' : 'no'} | ${result.buildMs} |`;
});
const ssrRows = results
	.filter((result) => result.ssrRenderMs !== undefined)
	.map(
		(result) =>
			`| ${result.variant} | ${result.ssrRenderMs} | ${kb(result.html.raw)} / ${kb(result.html.gzip)} | ${kb(result.classAttributeBytes)} |`,
	);
writeFileSync(
	join(spikeRoot, 'bench', 'results.md'),
	`# Benchmark results

Generated by \`node bench/run.mjs --runs ${reportOnly ? 3 : runs}\`. Sizes are KiB, raw / gzip level 9. "Library CSS" removes the theme
rules, which are identical in every variant. Build time is the median cold \`vite build\` (client only), in ms.

| Variant | App | JS | CSS | Library CSS | JS + CSS | Combobox CSS shipped | Build ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

## Realistic app server render

| Variant | renderToString ms (median of 5×100) | HTML raw / gzip | class attribute KiB |
| --- | --- | --- | --- |
${ssrRows.join('\n')}
`,
);
console.log('Wrote bench/results.json and bench/results.md');

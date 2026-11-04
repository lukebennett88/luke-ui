/*
 * Reproducible issue #705 TSX highlighter comparison.
 * Benchmark Shiki configured exactly like Luke UI's build-time ?highlight plugin.
 * All tools process the same trimmed Luke UI example sources.
 *
 * Run with a temporary npm package directory:
 *   npm install shiki@4.5.0 @tanstack/highlight@1.2.11 @twinkleplop/tsx@0.1.7
 *   node --expose-gc benchmark.mjs /path/to/luke-ui
 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { performance } from 'node:perf_hooks';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(process.argv[2] ?? process.cwd());
const arm = process.argv[3] ?? 'all';
const examplesRoot = join(repoRoot, 'apps/docs/src/examples');

function collect(dir) {
	const out = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...collect(path));
		else if (entry.isFile() && path.endsWith('.tsx')) out.push(path);
	}
	return out;
}

const fixtures = collect(examplesRoot)
	.sort()
	.map((path) => ({
		name: relative(repoRoot, path),
		source: readFileSync(path, 'utf8').trim(),
	}));

// These intentionally exercise nesting, JSX generics and escaping.
fixtures.push({
	name: 'synthetic/generic-tsx.tsx',
	source: [
		'import type { ComponentProps, ElementType } from "react";',
		'type Props<T extends ElementType> = { as: T } & ComponentProps<T>;',
		'const view = <T extends ElementType,>(props: Props<T>) => {',
		'  const Tag = props.as;',
		'  return <Tag aria-label="A & B" data-n={1 < 2 ? "yes" : "no"}>{`hi`}</Tag>;',
		'};',
	].join('\n'),
});
fixtures.push({
	name: 'synthetic/escaping.tsx',
	source: [
		'const pattern = /<script>.*?<\/script>/g;',
		'const str = "<script>alert(\"x\")</script> & \"quoted\"";',
		'// <button title="&<>&">literal</button>',
		'export const element = <span title={str}>{str}</span>;',
	].join('\n'),
});

if (arm === 'all') {
	const results = [];
	for (const library of ['shiki', 'tanstack', 'twinkleplop']) {
		const child = spawnSync(process.execPath, [
			'--expose-gc',
			fileURLToPath(import.meta.url),
			repoRoot,
			library,
		], { encoding: 'utf8', maxBuffer: 6 * 1024 * 1024, timeout: 240_000 });
		if (child.status !== 0) {
			throw new Error(library + ' process failed: ' + child.stderr + '\n' + child.stdout);
		}
		results.push(JSON.parse(child.stdout));
	}
	console.log(JSON.stringify({
		generatedAt: new Date().toISOString(),
		node: process.version,
		platform: process.platform + '/' + process.arch,
		fixtureCount: fixtures.length,
		inputBytes: fixtures.reduce((n, f) => n + Buffer.byteLength(f.source), 0),
		results,
	}, null, 2));
	process.exit(0);
}

function unwrapPre(html) {
	const start = html.indexOf('>');
	const end = html.lastIndexOf('</pre>');
	if (start < 0 || end < start) throw new Error('Unexpected code block HTML');
	return html.slice(start + 1, end);
}

const moduleStart = performance.now();
let htmlFor;
let importedMs;
let initializedMs;
if (arm === 'shiki') {
	const [{ createHighlighterCore }, { createJavaScriptRegexEngine }, tsx, light, dark] =
		await Promise.all([
			import('shiki/core'),
			import('shiki/engine/javascript'),
			import('shiki/langs/tsx.mjs'),
			import('shiki/themes/github-light-high-contrast.mjs'),
			import('shiki/themes/github-dark-high-contrast.mjs'),
		]);
	importedMs = performance.now() - moduleStart;
	const highlighter = await createHighlighterCore({
		engine: createJavaScriptRegexEngine(),
		langs: [tsx.default],
		themes: [light.default, dark.default],
	});
	initializedMs = performance.now() - moduleStart;
	htmlFor = (source) => highlighter.codeToHtml(source, {
		defaultColor: false,
		lang: 'tsx',
		themes: { light: light.default.name, dark: dark.default.name },
		transformers: [{
			name: 'docs:unwrap-pre',
			root(root) {
				const pre = root.children[0];
				if (pre?.type !== 'element') throw new Error('Missing Shiki pre');
				const code = pre.children[0];
				if (code?.type !== 'element') throw new Error('Missing Shiki code');
				code.properties.style = [pre.properties.style, code.properties.style]
					.filter(Boolean).join(';');
				root.children = [code];
			},
		}],
	});
} else if (arm === 'tanstack') {
	const [{ createHighlighter }, { tsx }] = await Promise.all([
		import('@tanstack/highlight/core'),
		import('@tanstack/highlight/languages/tsx'),
	]);
	importedMs = performance.now() - moduleStart;
	const highlighter = createHighlighter({ languages: [tsx] });
	initializedMs = performance.now() - moduleStart;
	htmlFor = (source) => unwrapPre(highlighter.highlightToHtml(source, { lang: 'tsx' }));
} else if (arm === 'twinkleplop') {
	const { language } = await import('@twinkleplop/tsx');
	importedMs = performance.now() - moduleStart;
	const highlighter = language();
	initializedMs = performance.now() - moduleStart;
	htmlFor = (source) => unwrapPre(highlighter(source));
} else {
	throw new Error('Unknown library: ' + arm);
}

function unescapeText(escaped) {
	return escaped.replace(/&(amp|lt|gt|quot|apos|#(?:x[0-9a-fA-F]+|[0-9]+));/g, (full, entity) => {
		if (entity === 'amp') return '&';
		if (entity === 'lt') return '<';
		if (entity === 'gt') return '>';
		if (entity === 'quot') return '"';
		if (entity === 'apos') return "'";
		if (entity.startsWith('#x')) return String.fromCodePoint(parseInt(entity.slice(2), 16));
		if (entity.startsWith('#')) return String.fromCodePoint(Number(entity.slice(1)));
		return full;
	});
}

const html = fixtures.map((fixture) => htmlFor(fixture.source));
let mismatchCount = 0;
const mismatches = [];
for (let i = 0; i < fixtures.length; i += 1) {
	const restored = unescapeText(html[i].replace(/<[^>]*>/g, ''));
	if (restored !== fixtures[i].source) {
		mismatchCount += 1;
		if (mismatches.length < 5) {
			let offset = 0;
			while (offset < restored.length &&
				restored[offset] === fixtures[i].source[offset]) offset += 1;
			mismatches.push({
				file: fixtures[i].name,
				offset,
				expected: fixtures[i].source.slice(offset, offset + 70),
				actual: restored.slice(offset, offset + 70),
			});
		}
	}
}

// Warm each arm using the full corpus, then record seven trials of equal work.
for (let n = 0; n < 2; n += 1) for (const fixture of fixtures) htmlFor(fixture.source);
const trialsMs = [];
const repetitions = 4;
for (let trial = 0; trial < 7; trial += 1) {
	global.gc?.();
	const t0 = performance.now();
	for (let r = 0; r < repetitions; r += 1) {
		for (const fixture of fixtures) htmlFor(fixture.source);
	}
	trialsMs.push(performance.now() - t0);
}
const medianMs = [...trialsMs].sort((a, b) => a - b)[3];
const totalHtml = html.join('\n');
console.log(JSON.stringify({
	library: arm,
	importMs: Number(importedMs.toFixed(2)),
	initMsIncludingImport: Number(initializedMs.toFixed(2)),
	medianMsPerCorpus: Number((medianMs / repetitions).toFixed(3)),
	highlightsPerSecond: Math.round(fixtures.length * repetitions * 1000 / medianMs),
	trialsMs: trialsMs.map((n) => Number(n.toFixed(2))),
	htmlBytes: Buffer.byteLength(totalHtml),
	htmlGzipBytes: gzipSync(totalHtml).length,
	spanCount: (totalHtml.match(/<span\b/g) ?? []).length,
	reconstructionMismatches: mismatchCount,
	firstMismatches: mismatches,
	exampleHtmlBytes: {
		checkboxControlled: (() => {
			const i = fixtures.findIndex((f) => f.name.endsWith('checkbox-field/controlled.tsx'));
			return i < 0 ? null : Buffer.byteLength(html[i]);
		})(),
	},
}));

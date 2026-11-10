/* eslint-disable no-console -- A command-line script: it reports to the terminal and runs builds and browser steps one at a time. */
// Attributes the optimised VE consumer's realistic CSS to source modules through the per-module
// sublayers, to separate engine cost from the features the VE components ship and the prototype lacks.
//
//   node bench/attribute-ve.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { parse } from 'postcss';

const spikeRoot = fileURLToPath(new URL('..', import.meta.url));
const names = JSON.parse(
	readFileSync(join(spikeRoot, 'vendor', 'optimised', 'sublayers.json'), 'utf8'),
);
const assets = join(spikeRoot, 'consumers', 've-optimised', 'dist', 'realistic', 'assets');
const css = readdirSync(assets)
	.filter((file) => file.endsWith('.css'))
	.map((file) => readFileSync(join(assets, file), 'utf8'))
	.join('\n');
const bySource = new Map();
parse(css).walkAtRules('layer', (rule) => {
	const match = /\.(m\d+)$/.exec(rule.params);
	if (!match || !rule.nodes) return;
	const source = names[match[1]];
	bySource.set(source, (bySource.get(source) ?? '') + rule.toString());
});
const rows = [...bySource]
	.map(([source, text]) => [source, text.length, gzipSync(text, { level: 9 }).length])
	.toSorted((a, b) => b[1] - a[1]);
for (const [source, raw, gzip] of rows)
	console.log(
		`${(raw / 1024).toFixed(1).padStart(6)} KiB raw ${(gzip / 1024).toFixed(1).padStart(5)} KiB gzip  ${source}`,
	);

// The modules that implement what the prototype covers: Box, Button, Text, Combobox, and Field
// text. Excludes the mobile tray, spinners, icons, and lockup, which the prototype does not ship.
const comparable = [
	'src/core/styles/utilities.css.ts',
	'src/core/primitives/button/recipe.css.ts',
	'src/core/button/styles.css.ts',
	'src/core/primitives/combobox/styles.css.ts',
	'src/core/text/recipe.css.ts',
	'src/core/primitives/field/recipe.css.ts',
];
const subset = comparable.map((source) => bySource.get(source) ?? '').join('');
const { transform } = await import('lightningcss');
const minified = transform({
	code: Buffer.from(subset),
	filename: 'subset.css',
	minify: true,
}).code;
console.log(
	`\nComparable VE modules together, minified: ${(minified.length / 1024).toFixed(1)} KiB raw, ${(gzipSync(minified, { level: 9 }).length / 1024).toFixed(1)} KiB gzip`,
);

/* eslint-disable no-console -- A command-line script: it reports to the terminal and runs builds and browser steps one at a time. */
// Builds the bounded "optimised Vanilla Extract" baseline from the packed package, without a second
// styling engine. Every rule in `dist/stylesheet.css` is attributed to its source `.css.ts` module
// through the stylesheet's sourcemap. The module's JS chunk then imports a CSS file with only those
// rules, so a consumer's bundler drops CSS for components the app never imports. Document-level
// rules (layer order, reset, registered properties) stay in a slim `stylesheet.css`.
//
// Vanilla Extract resolves equal-specificity conflicts by source order inside `luke-ui.recipes`,
// and a bundler orders split CSS by import graph, not by that order. So each source module gets
// its own sublayer, declared up front in today's module order: `luke-ui.recipes.m0`, `m1`, and so
// on. `--naive` skips the sublayers, to reproduce the ordering regression that motivates them.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'postcss';

const spikeRoot = fileURLToPath(new URL('..', import.meta.url));
const work = join(spikeRoot, 'vendor', 'optimised');
rmSync(work, { force: true, recursive: true });
mkdirSync(work, { recursive: true });
execFileSync('tar', ['-xzf', join(spikeRoot, 'vendor', 'luke-ui-react.tgz'), '-C', work]);
const pkg = join(work, 'package');
const dist = join(pkg, 'dist');

// Source modules whose rules stay global.
const globalSources = new Set([
	'src/core/styles/layers.css.ts',
	'src/core/styles/global-styles.css.ts',
	'src/core/styles/state-layer.css.ts',
]);
const normalise = (source) => {
	const index = source.indexOf('src/');
	return index === -1 ? source : source.slice(index).replace(/\.vanilla\.css$/, '');
};

// Which chunk owns each `.css.ts` module.
const chunkBySource = new Map();
for (const file of readdirSync(dist).filter((name) => name.endsWith('.js.map'))) {
	const map = JSON.parse(readFileSync(join(dist, file), 'utf8'));
	for (const source of map.sources) {
		if (source.endsWith('.css.ts'))
			chunkBySource.set(normalise(source), file.replace(/\.map$/, ''));
	}
}

const css = readFileSync(join(dist, 'stylesheet.css'), 'utf8');
const map = readFileSync(join(dist, 'stylesheet.css.map'), 'utf8');
const root = parse(css, { from: join(dist, 'stylesheet.css'), map: { prev: map } });

const naive = process.argv.includes('--naive');
const moduleIndex = new Map();
const sublayers = { 'luke-ui.recipes': [], 'luke-ui.utilities': [] };
const globalNodes = [];
const nodesByChunk = new Map();
const unattributed = new Set();
function sourceOf(node) {
	const origin = node.source?.input.origin(node.source.start.line, node.source.start.column);
	return origin ? normalise(relative(spikeRoot, origin.file ?? origin.url ?? '')) : undefined;
}
for (const node of root.nodes) {
	// Rules inside a named layer block are attributed one by one and rewrapped in that layer.
	const isLayerBlock = node.type === 'atrule' && node.name === 'layer' && node.nodes;
	const children = isLayerBlock ? node.nodes : [node];
	for (const child of children) {
		const source = sourceOf(child);
		const chunk = source && !globalSources.has(source) ? chunkBySource.get(source) : undefined;
		// PostCSS prints a statement at-rule such as `@layer a, b` without its semicolon.
		const own = child.type === 'atrule' && !child.nodes ? `${child.toString()};` : child.toString();
		let layer = isLayerBlock ? node.params : undefined;
		if (chunk && !naive && layer in sublayers) {
			if (!moduleIndex.has(source)) moduleIndex.set(source, moduleIndex.size);
			const sublayer = `${layer}.m${moduleIndex.get(source)}`;
			if (!sublayers[layer].includes(sublayer)) sublayers[layer].push(sublayer);
			layer = sublayer;
		}
		const text = layer ? `@layer ${layer}{${own}}` : own;
		if (!chunk) {
			if (source && !globalSources.has(source)) unattributed.add(source);
			globalNodes.push(text);
			continue;
		}
		const list = nodesByChunk.get(chunk) ?? [];
		list.push(text);
		nodesByChunk.set(chunk, list);
	}
}

for (const [chunk, nodes] of nodesByChunk) {
	const cssName = chunk.replace(/\.js$/, '.styles.css');
	writeFileSync(join(dist, cssName), `${nodes.join('\n')}\n`);
	const jsPath = join(dist, chunk);
	writeFileSync(jsPath, `import './${cssName}';\n${readFileSync(jsPath, 'utf8')}`);
}
// The sublayer order statement must precede every split file, so it opens the global stylesheet.
const order = Object.values(sublayers)
	.filter((names) => names.length > 0)
	.map((names) => `@layer ${names.join(', ')};`);
writeFileSync(
	join(dist, 'stylesheet.css'),
	`${[...globalNodes.slice(0, 2), ...order, ...globalNodes.slice(2)].join('\n')}\n`,
);
rmSync(join(dist, 'stylesheet.css.map'));

const manifest = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8'));
manifest.sideEffects = ['**/*.css'];
writeFileSync(join(pkg, 'package.json'), `${JSON.stringify(manifest, null, '\t')}\n`);
// Which source module each sublayer holds, for the CSS attribution in `bench/attribute-ve.mjs`.
writeFileSync(
	join(work, 'sublayers.json'),
	`${JSON.stringify(Object.fromEntries([...moduleIndex].map(([source, index]) => [`m${index}`, source])), null, '\t')}\n`,
);
execFileSync('tar', ['-czf', join(work, 'luke-ui-react.tgz'), '-C', work, 'package']);
console.log(
	`Split ${[...nodesByChunk.values()].flat().length} rules into ${nodesByChunk.size} chunks and ` +
		`${moduleIndex.size} module sublayers; ` +
		`${globalNodes.length} stay global. Unattributed sources: ${[...unattributed].join(', ') || 'none'}`,
);

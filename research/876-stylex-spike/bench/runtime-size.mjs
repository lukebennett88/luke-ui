/* eslint-disable no-await-in-loop, no-console -- A command-line script: it reports to the terminal and runs builds and browser steps one at a time. */
// Measures the styling runtime each approach ships to the browser, separately from component code.
//
//   node bench/runtime-size.mjs
//
// Vanilla Extract: the recipe engine chunk, Rainbow Sprinkles' runtime, and `@vanilla-extract/dynamic`.
// StyleX: `stylex.props` plus the prototype's recipe and prop-merging helpers.
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

const spikeRoot = fileURLToPath(new URL('..', import.meta.url));
const veConsumer = join(spikeRoot, 'consumers', 've');
const require = createRequire(join(veConsumer, 'package.json'));
const { build } = await import(pathToFileURL(require.resolve('vite')).href);
const reactDist = join(require.resolve('@luke-ui/react/package.json'), '..', 'dist');
const recipeEngine = readdirSync(reactDist).find((file) => /^recipe-engine-.*\.js$/.test(file));
const sprinkles = join(
	require.resolve('@luke-ui/rainbow-sprinkles/package.json'),
	'..',
	'dist',
	'create-runtime-fn.js',
);
// `@vanilla-extract/dynamic` is a dependency of the package, not of the app, so resolve it from there.
const dynamic = createRequire(join(reactDist, '..', 'package.json')).resolve(
	'@vanilla-extract/dynamic',
);
const lib = join(spikeRoot, 'lib', 'dist', 'precompiled');

// Each entry is built from the consumer that installs its dependencies.
const entries = {
	'stylex runtime': [
		join(spikeRoot, 'consumers', 'stylex-precompiled'),
		`export { props } from '@stylexjs/stylex';\nexport { recipe } from '${join(lib, 'recipe.js')}';\nexport { styleProps, composeClassName } from '${join(lib, 'merge.js')}';`,
	],
	'vanilla-extract runtime': [
		veConsumer,
		`export * from '${join(reactDist, recipeEngine)}';\nexport * from '${sprinkles}';\nexport { assignInlineVars } from '${dynamic}';`,
	],
};

const results = {};
for (const [name, [root, source]] of Object.entries(entries)) {
	const work = join(root, '.runtime-size');
	rmSync(work, { force: true, recursive: true });
	mkdirSync(work, { recursive: true });
	const entry = join(work, 'entry.js');
	writeFileSync(entry, source);
	const output = await build({
		build: {
			lib: { entry, formats: ['es'] },
			minify: true,
			outDir: join(work, 'out'),
			write: false,
		},
		configFile: false,
		logLevel: 'silent',
		root,
	});
	const code = [output]
		.flat()[0]
		.output.map((chunk) => chunk.code ?? '')
		.join('');
	results[name] = { gzip: gzipSync(code, { level: 9 }).length, raw: code.length };
	rmSync(work, { force: true, recursive: true });
}
writeFileSync(
	join(spikeRoot, 'bench', 'runtime-size.json'),
	`${JSON.stringify(results, null, '\t')}\n`,
);
console.log(results);

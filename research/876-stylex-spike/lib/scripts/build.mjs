import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
/* eslint-disable no-await-in-loop, no-console -- A command-line script: it reports to the terminal and runs builds and browser steps one at a time. */
// Builds the prototype's distributions:
//
// - `dist/precompiled`: StyleX compiled away. JS keeps only the `stylex.props` runtime, and one
//   `stylesheet.css` holds every atom. No consumer compiler.
// - `dist/precompiled-split`: the same JS, but each module imports a CSS file with only its own
//   atoms, so a bundler drops the CSS of modules the app never imports. Still no consumer compiler.
// - `dist/source`: TypeScript and JSX removed, `stylex.create` left in place. The consumer's StyleX
//   compiler extracts it together with the app's own styles.
import { transformAsync } from '@babel/core';
import presetReact from '@babel/preset-react';
import presetTypescript from '@babel/preset-typescript';
import stylexPlugin from '@stylexjs/babel-plugin';

const libRoot = fileURLToPath(new URL('..', import.meta.url));
const src = join(libRoot, 'src');
const dist = join(libRoot, 'dist');
const layerPrefix = 'luke-ui.recipes';

rmSync(dist, { force: true, recursive: true });
const modules = readdirSync(src).filter((file) => /\.tsx?$/.test(file));

const presets = [
	[presetTypescript, { allExtensions: true, isTSX: true }],
	[presetReact, { runtime: 'automatic' }],
];

function outName(file) {
	return file.replace(/\.tsx?$/, '.js');
}

async function build() {
	// Source distribution.
	mkdirSync(join(dist, 'source'), { recursive: true });
	for (const file of modules) {
		const code = readFileSync(join(src, file), 'utf8');
		const result = await transformAsync(code, {
			babelrc: false,
			configFile: false,
			filename: join(src, file),
			presets,
		});
		writeFileSync(join(dist, 'source', outName(file)), result.code);
	}
	copyFileSync(join(src, 'global.css'), join(dist, 'source', 'global.css'));

	// Precompiled distributions.
	const rulesByModule = new Map();
	const compiled = new Map();
	for (const file of modules) {
		const code = readFileSync(join(src, file), 'utf8');
		const result = await transformAsync(code, {
			babelrc: false,
			configFile: false,
			filename: join(src, file),
			plugins: [
				[
					stylexPlugin,
					{
						dev: false,
						enableMediaQueryOrder: true,
						runtimeInjection: false,
						styleResolution: 'application-order',
						treeshakeCompensation: true,
						unstable_moduleResolution: { rootDir: libRoot, type: 'commonJS' },
					},
				],
			],
			presets,
		});
		rulesByModule.set(file, result.metadata.stylex ?? []);
		compiled.set(file, result.code);
	}
	const allRules = [...rulesByModule.values()].flat();
	const css = stylexPlugin.processStylexRules(allRules, { useLayers: { prefix: layerPrefix } });
	const globalCss = readFileSync(join(src, 'global.css'), 'utf8');

	mkdirSync(join(dist, 'precompiled'), { recursive: true });
	for (const [file, code] of compiled)
		writeFileSync(join(dist, 'precompiled', outName(file)), code);
	writeFileSync(join(dist, 'precompiled', 'stylesheet.css'), `${globalCss}\n${css}`);

	// Split: keep the library-wide layer order in `global.css`, then give each module the lines of
	// the full stylesheet that belong to its own atoms. Filtering one stylesheet keeps every atom in
	// the same priority layer it has in the unsplit build.
	mkdirSync(join(dist, 'precompiled-split'), { recursive: true });
	const header = css.split('\n').find((line) => line.startsWith('@layer ') && line.endsWith(';'));
	// Registered properties have no class, so they stay global with the layer order.
	const registered = css.split('\n').filter((line) => line.startsWith('@property '));
	writeFileSync(
		join(dist, 'precompiled-split', 'global.css'),
		`${globalCss}\n${header}\n${registered.join('\n')}\n`,
	);
	for (const [file, code] of compiled) {
		const hashes = new Set(rulesByModule.get(file).map(([hash]) => hash));
		let moduleCss = '';
		let openLayer = null;
		for (const line of css.slice(css.indexOf(header) + header.length).split('\n')) {
			const layerStart = /^@layer ([\w.-]+)\{$/.exec(line);
			if (layerStart) {
				openLayer = layerStart[1];
				continue;
			}
			if (line === '}') {
				openLayer = null;
				continue;
			}
			const classes = [...line.matchAll(/\.([a-z0-9]+)[.:{\s,)]/g)].map((match) => match[1]);
			if (!classes.some((name) => hashes.has(name))) continue;
			moduleCss += openLayer ? `@layer ${openLayer}{${line}}\n` : `${line}\n`;
		}
		const name = outName(file);
		let output = code;
		if (moduleCss) {
			const cssName = `${basename(name, '.js')}.module-styles.css`;
			writeFileSync(join(dist, 'precompiled-split', cssName), moduleCss);
			output = `import './${cssName}';\n${code}`;
		}
		writeFileSync(join(dist, 'precompiled-split', name), output);
	}
	console.log(
		`Built ${modules.length} modules, ${allRules.length} StyleX rules, ${css.length} bytes of atoms.`,
	);
}

await build();

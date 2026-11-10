import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
/* eslint-disable no-await-in-loop, no-console -- A command-line script: it reports to the terminal and runs builds and browser steps one at a time. */
// Compiles small StyleX snippets with the same Babel plugin and options as the prototype, and
// reports each limitation the spike ran into. Every probe prints whether it reproduced.
//
//   node lib/scripts/probes.mjs
import { transformAsync } from '@babel/core';
import presetTypescript from '@babel/preset-typescript';
import stylexPlugin from '@stylexjs/babel-plugin';

const dir = fileURLToPath(new URL('../.probes/', import.meta.url));
rmSync(dir, { force: true, recursive: true });
mkdirSync(dir, { recursive: true });

async function compile(files) {
	const rules = [];
	const code = {};
	for (const [name, source] of Object.entries(files)) writeFileSync(join(dir, name), source);
	for (const name of Object.keys(files)) {
		const result = await transformAsync(files[name], {
			babelrc: false,
			configFile: false,
			filename: join(dir, name),
			plugins: [
				[
					stylexPlugin,
					{
						dev: false,
						enableMediaQueryOrder: true,
						runtimeInjection: false,
						styleResolution: 'application-order',
						unstable_moduleResolution: { rootDir: dir, type: 'commonJS' },
					},
				],
			],
			presets: [[presetTypescript, { allExtensions: true, isTSX: true }]],
		});
		rules.push(...result.metadata.stylex);
		code[name] = result.code;
	}
	return { code, css: stylexPlugin.processStylexRules(rules, { useLayers: true }) };
}

async function probe(title, run) {
	try {
		const { reproduced, detail } = await run();
		console.log(
			`${reproduced ? 'REPRODUCED' : 'not reproduced'}: ${title}${detail ? `\n    ${detail}` : ''}`,
		);
	} catch (error) {
		console.log(
			`REPRODUCED (compile error): ${title}\n    ${String(error.message).split('\n')[0].replace(dir, '')}`,
		);
	}
}

const header = "import * as stylex from '@stylexjs/stylex';\n";

await probe('Same-priority states are ordered by value, not authoring order', async () => {
	const { css } = await compile({
		'order.tsx': `${header}export const s = stylex.create({ a: { boxShadow: { default: 'none', ':is([data-hovered])': 'var(--raised)', ':is([data-pressed])': 'var(--inset)' } } });`,
	});
	const hovered = css.indexOf('var(--raised)');
	const pressed = css.indexOf('var(--inset)');
	return {
		detail: 'pressed is authored last but emitted first, so hover wins when both match',
		reproduced: pressed < hovered,
	};
});

await probe('A selector shared through defineConsts emits malformed CSS', async () => {
	const { css } = await compile({
		'consts.stylex.ts': `${header}export const c = stylex.defineConsts({ hovered: ':is([data-hovered="true"])' });`,
		'use.tsx': `${header}import { c } from './consts.stylex';\nexport const s = stylex.create({ a: { color: { default: 'x', [c.hovered]: 'y' } } });`,
	});
	const line = css.split('\n').find((text) => text.includes('color:y'));
	return { detail: line, reproduced: line.startsWith(':is(') };
});

await probe('A selector string imported from a plain module is rejected', () =>
	compile({
		'selectors.ts': `export const hovered = ':is([data-hovered="true"])';`,
		'import.tsx': `${header}import { hovered } from './selectors';\nexport const s = stylex.create({ a: { color: { default: 'x', [hovered]: 'y' } } });`,
	}).then(() => ({ reproduced: false })),
);

await probe('A style helper imported from another module is rejected', () =>
	compile({
		'helpers.ts': `export const pair = (bg: string) => ({ backgroundColor: bg });`,
		'helper.tsx': `${header}import { pair } from './helpers';\nexport const s = stylex.create({ a: pair('red') });`,
	}).then(() => ({ reproduced: false })),
);

await probe('A local helper with a block body is rejected', () =>
	compile({
		'block.tsx': `${header}const pair = (bg: string) => { return { backgroundColor: bg }; };\nexport const s = stylex.create({ a: pair('red') });`,
	}).then(() => ({ reproduced: false })),
);

await probe('Indexing an imported token group by a parameter is rejected', () =>
	compile({
		'tokens.stylex.ts': `${header}export const t = stylex.unstable_defineConstsNested({ body: { trim: 'var(--a)' } });`,
		'index.tsx': `${header}import { t } from './tokens.stylex';\nconst trim = (style: 'body') => ({ marginBlockEnd: t[style].trim });\nexport const s = stylex.create({ a: trim('body') });`,
	}).then(() => ({ reproduced: false })),
);

await probe('A dynamic style built by a factory function is rejected', () =>
	compile({
		'factory.tsx': `${header}const responsive = (p: string) => (v: string) => ({ [p]: v });\nexport const s = stylex.create({ padding: responsive('padding') });`,
	}).then(() => ({ reproduced: false })),
);

await probe('stylex.when.ancestor() stored in a constant is left as a runtime call', async () => {
	const { code } = await compile({
		'when.tsx': `${header}const disabled = stylex.when.ancestor(':where([data-disabled])');\nexport const s = stylex.create({ a: { color: { default: 'x', [disabled]: 'y' } } });`,
	});
	return {
		detail: 'throws "Unexpected \'stylex.when.ancestor\' call at runtime" when the module loads',
		reproduced: code['when.tsx'].includes('stylex.when.ancestor('),
	};
});

await probe('Logical block properties are rewritten to physical properties', async () => {
	const { css } = await compile({
		'logical.tsx': `${header}export const s = stylex.create({ a: { marginBlockEnd: 1, paddingBlockStart: 2 } });`,
	});
	return {
		detail: css.match(/\{(margin|padding)-[a-z-]+:/g).join(' '),
		reproduced: /margin-bottom|padding-top/.test(css),
	};
});

await probe(
	'Container queries are not ordered by width; ties fall back to the declaration value',
	async () => {
		const { css } = await compile({
			'container.tsx': `${header}export const s = stylex.create({ a: { padding: { default: 1, '@container (inline-size >= 640px)': 9, '@container (inline-size >= 1536px)': 3 } } });`,
		});
		return {
			detail: 'later rules win, so a 1600px container resolves to the 640px value',
			reproduced: css.indexOf('1536px') < css.indexOf('640px'),
		};
	},
);

await probe('A null dynamic condition concatenates "null" into the class string', async () => {
	const { code } = await compile({
		'dynamic.tsx': `${header}export const s = stylex.create({ p: (a: string | null, b: string | null) => ({ paddingInlineStart: { default: a, '@container (inline-size >= 640px)': b } }) });`,
	});
	return {
		detail: code['dynamic.tsx'].match(/\(a != null[^)]*\)[^)]*\)/)?.[0],
		reproduced: /: a\) \+ \(b != null/.test(code['dynamic.tsx']),
	};
});

await probe('Typed custom properties always register with inherits: true', async () => {
	const { css } = await compile({
		'typed.stylex.ts': `${header}export const v = stylex.defineVars({ '--layer': stylex.types.color({ default: 'transparent' }) });`,
	});
	return {
		detail: css.split('\n').find((line) => line.startsWith('@property')),
		reproduced: css.includes('inherits: true'),
	};
});

await probe(
	'In the built library stylesheet, custom property atoms sit outside every cascade layer',
	async () => {
		// The trigger depends on which rules share StyleX's first priority group, so read the real build.
		const css = readFileSync(
			fileURLToPath(new URL('../dist/precompiled/stylesheet.css', import.meta.url)),
			'utf8',
		);
		const atoms =
			css
				.slice(0, css.indexOf('@layer luke-ui.recipes.priority2{'))
				.match(/^\.x[a-z0-9]+\{--[^}]+\}$/gm) ?? [];
		return {
			detail: `${atoms.length} unlayered atoms, for example ${atoms[0]}`,
			reproduced: atoms.length > 0,
		};
	},
);

rmSync(dir, { force: true, recursive: true });

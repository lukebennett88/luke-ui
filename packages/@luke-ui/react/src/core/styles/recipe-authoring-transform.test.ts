import { transformAsync } from '@babel/core';
import stylexBabelPlugin from '@stylexjs/babel-plugin';
import * as stylex from '@stylexjs/stylex';
import { expect, test } from 'vite-plus/test';
import { recipeAuthoringBabelPlugin } from '../../../recipe-authoring-babel-plugin.js';
import { workspaceRoot } from '../../../stylex-vite-plugin.js';
import {
	recipeFromCompiled,
	resolveRecipeSlotProps,
	slottedRecipeFromCompiled,
} from './recipe-authoring.js';

const RECIPE_FILENAME = 'src/core/example/recipe.ts';

const PREAMBLE = [
	"import * as stylex from '@stylexjs/stylex';",
	"import { recipe } from '../styles/recipe-authoring.js';",
].join('\n');

async function expand(code: string): Promise<string> {
	const result = await transformAsync(code, {
		babelrc: false,
		configFile: false,
		filename: RECIPE_FILENAME,
		parserOpts: { plugins: ['typescript'] },
		plugins: [recipeAuthoringBabelPlugin],
	});
	return result?.code ?? '';
}

/** Run recipe expansion and StyleX extraction together. */
async function expandAndExtract(code: string): Promise<ReadonlyArray<unknown>> {
	const result = await transformAsync(code, {
		babelrc: false,
		configFile: false,
		filename: RECIPE_FILENAME,
		parserOpts: { plugins: ['typescript'] },
		plugins: [
			recipeAuthoringBabelPlugin,
			stylexBabelPlugin.withOptions({
				dev: false,
				unstable_moduleResolution: { type: 'commonJS', rootDir: workspaceRoot },
			}),
		],
	});

	const metadata = result?.metadata as { stylex?: ReadonlyArray<unknown> } | undefined;
	return metadata?.stylex ?? [];
}

test('a module that calls recipe() without the StyleX namespace import gets one inserted', async () => {
	const code = await expand(
		[
			"import { recipe } from '../styles/recipe-authoring.js';",
			'export const r = recipe({ base: { color: "red" } });',
		].join('\n'),
	);
	expect(code).toContain('import * as stylex from "@stylexjs/stylex"');

	const rules = await expandAndExtract(
		[
			"import { recipe } from '../styles/recipe-authoring.js';",
			'export const r = recipe({ base: { color: "red" } });',
		].join('\n'),
	);
	expect(rules.length).toBeGreaterThan(0);
});

test('a module that already imports the StyleX namespace keeps its own import, not a duplicate', async () => {
	const code = await expand(
		[PREAMBLE, 'export const r = recipe({ base: { color: "red" } });'].join('\n'),
	);

	expect(code.match(/import \* as stylex from '@stylexjs\/stylex'/gu)).toHaveLength(1);
});

test('a module that binds the name `stylex` to something else is rejected', async () => {
	await expect(
		expand(
			[
				"import { recipe } from '../styles/recipe-authoring.js';",
				"import stylex from 'not-the-real-stylex';",
				'export const r = recipe({ base: { color: "red" } });',
			].join('\n'),
		),
	).rejects.toThrow(/already bound/);
});

test('a plain object passed where a compiled style is expected is rejected', async () => {
	await expect(
		expand(
			[
				PREAMBLE,
				'const sharedBase = { color: "red" };',
				'export const r = recipe({ base: sharedBase });',
			].join('\n'),
		),
	).rejects.toThrow(/Unsupported style value at base/);
});

test('an export the transform cannot trace to compiled provenance is rejected', async () => {
	await expect(
		expand(
			[
				PREAMBLE,
				"import { somethingElse } from '../visually-hidden/recipe.js';",
				'export const r = recipe({ base: somethingElse });',
			].join('\n'),
		),
	).rejects.toThrow(/Unsupported style value at base/);
});

test('a call expression standing in for a style is rejected', async () => {
	await expect(
		expand([PREAMBLE, 'export const r = recipe({ base: buildStyle() });'].join('\n')),
	).rejects.toThrow(/Unsupported style value at base/);
});

test('variant values that sanitise to the same generated key are rejected', async () => {
	await expect(
		expand(
			[
				PREAMBLE,
				'export const r = recipe({ variants: { tone: {',
				'  "a-b": { color: "red" },',
				'  "a_b": { color: "blue" },',
				'} } });',
			].join('\n'),
		),
	).rejects.toThrow(/generate the same StyleX key/);
});

test('a variant value naming an undeclared slot is rejected', async () => {
	await expect(
		expand(
			[
				PREAMBLE,
				'export const r = recipe({',
				'  slots: { root: { color: "red" } },',
				'  variants: { tone: { accent: { bogus: { color: "blue" } } } },',
				'});',
			].join('\n'),
		),
	).rejects.toThrow(/"bogus" at tone.accent is not a declared slot/);
});

test('a compound variant with no style is rejected', async () => {
	await expect(
		expand(
			[
				PREAMBLE,
				'export const r = recipe({',
				'  variants: { tone: { accent: null } },',
				'  compoundVariants: [{ tone: "accent" }],',
				'});',
			].join('\n'),
		),
	).rejects.toThrow(/compoundVariants\[0\] has no `style`/);
});

test('a configuration held in a variable is rejected', async () => {
	await expect(
		expand(
			[
				PREAMBLE,
				'const config = { base: { color: "red" } };',
				'export const r = recipe(config);',
			].join('\n'),
		),
	).rejects.toThrow(/single object literal/);
});

test('a spread in the recipe configuration is rejected', async () => {
	await expect(
		expand([PREAMBLE, 'export const r = recipe({ ...other, base: {} });'].join('\n')),
	).rejects.toThrow(/plain `key: value` properties/);
});

test('a recipe() call that is not assigned to a variable is rejected', async () => {
	await expect(
		expand([PREAMBLE, 'export function make() { return recipe({ base: {} }); }'].join('\n')),
	).rejects.toThrow(/assigned to a variable declaration/);
});

test('every accepted provenance form passes through by reference, uncopied', async () => {
	const code = await expand(
		[
			PREAMBLE,
			"import { compiledStyle as mark } from '../styles/recipe-authoring.js';",
			"import { visuallyHiddenStyle } from '../visually-hidden/recipe.js';",
			"import { iconSizeStyles } from '../icon/recipe.js';",
			'const local = stylex.create({ pad: { padding: "4px" } });',
			'const aliased = local.pad;',
			'const grouped = { a: local.pad } as const;',
			'export const r = recipe({',
			'  base: [mark(visuallyHiddenStyle), aliased, grouped.a, { color: "red" }],',
			'  variants: { size: { large: mark(iconSizeStyles.large) } },',
			'});',
		].join('\n'),
	);

	expect(code).toContain('ref: visuallyHiddenStyle');
	expect(code).toContain('ref: aliased');
	expect(code).toContain('ref: grouped.a');
	expect(code).toContain('ref: iconSizeStyles.large');

	const generatedStart = code.lastIndexOf('stylex.create({');
	const generated = code.slice(generatedStart, code.indexOf('recipeFromCompiled', generatedStart));
	expect(generated).toContain('color: "red"');
	expect(generated).not.toContain('padding');
});

test('a StyleX-supported expression inside a style literal is preserved', async () => {
	const code = await expand(
		[
			PREAMBLE,
			'const spin = stylex.keyframes({ to: { transform: "rotate(360deg)" } });',
			'const sizeVar = "--control-size";',
			'export const r = recipe({ base: { animationName: spin, [sizeVar]: "16px" } });',
		].join('\n'),
	);

	expect(code).toContain('animationName: spin');
	expect(code).toContain('[sizeVar]: "16px"');

	expect(code.indexOf('stylex.keyframes')).toBeLessThan(code.indexOf('stylex.create'));
});

test('compiledStyle markers work in slots and compound variants', async () => {
	const code = await expand(
		[
			PREAMBLE,
			"import { compiledStyle as mark } from '../styles/recipe-authoring.js';",
			"import { externalStyle } from '../shared/recipe.js';",
			'export const r = recipe({',
			'  slots: { root: mark(externalStyle) },',
			'  variants: { tone: { loud: { root: mark(externalStyle) } } },',
			'  compoundVariants: [{ tone: "loud", style: { root: mark(externalStyle) } }],',
			'});',
		].join('\n'),
	);

	expect(code.match(/ref: externalStyle/gu)).toHaveLength(3);
	expect(code).not.toContain('mark(');
});

test('the expansion carries structure only, never a style value, into the runtime call', async () => {
	const code = await expand(
		[
			PREAMBLE,
			'export const r = recipe({',
			'  base: { color: "red" },',
			'  variants: { tone: { accent: { color: "blue" }, neutral: null } },',
			'  defaultVariants: { tone: "accent" },',
			'});',
		].join('\n'),
	);

	const runtimeCall = code.slice(code.indexOf('= recipeFromCompiled('));
	expect(runtimeCall).not.toContain('color');
	expect(runtimeCall).toContain('group: "tone"');
	expect(runtimeCall).toContain('neutral: null');

	expect(code).not.toMatch(/\brecipe\(/);
});

const compiledStyles = stylex.create({
	base: { color: 'rgb(1, 1, 1)' },
	compound0: { color: 'rgb(2, 2, 2)' },
	slotRoot: { color: 'rgb(3, 3, 3)' },
	slotTrack: { color: 'rgb(4, 4, 4)' },
	toneAccent: { color: 'rgb(5, 5, 5)' },
});

test('the generated single-part mapping resolves base, variants, then compounds in order', () => {
	const built = recipeFromCompiled(compiledStyles, {
		base: [{ key: 'base', tag: 'key' }],
		compoundVariants: [{ conditions: { tone: 'accent' }, style: { key: 'compound0', tag: 'key' } }],
		defaultVariants: { tone: 'neutral' },
		variants: [
			{ group: 'tone', values: { accent: { key: 'toneAccent', tag: 'key' }, neutral: null } },
		],
	});

	expect(built().className).toBe(stylex.props(compiledStyles.base).className);
	expect(built({ tone: 'accent' }).className).toBe(
		stylex.props(compiledStyles.base, compiledStyles.toneAccent, compiledStyles.compound0)
			.className,
	);
});

test('the generated slotted mapping gives a compound only to the slots it names', () => {
	const built = slottedRecipeFromCompiled(compiledStyles, {
		base: {
			root: [{ key: 'slotRoot', tag: 'key' }],
			track: [{ key: 'slotTrack', tag: 'key' }],
		},
		compoundVariants: [
			{ conditions: { tone: 'accent' }, style: { track: { key: 'compound0', tag: 'key' } } },
		],
		defaultVariants: { tone: 'neutral' },
		slotNames: ['root', 'track'],
		variants: [{ group: 'tone', values: { accent: {}, neutral: null } }],
	});

	const parts = built({ tone: 'accent' });
	expect(parts.root?.className).toBe(stylex.props(compiledStyles.slotRoot).className);
	expect(parts.track?.className).toBe(
		stylex.props(compiledStyles.slotTrack, compiledStyles.compound0).className,
	);
});

test('the private slot resolver agrees with the public result and resolves one slot', () => {
	let trackVariantReads = 0;
	const built = slottedRecipeFromCompiled(compiledStyles, {
		base: {
			root: [{ key: 'slotRoot', tag: 'key' }],
			track: [{ key: 'slotTrack', tag: 'key' }],
		},
		compoundVariants: [],
		defaultVariants: { tone: 'accent' },
		slotNames: ['root', 'track'],
		variants: [
			{
				group: 'tone',
				values: {
					accent: {
						root: { key: 'toneAccent', tag: 'key' },
						get track() {
							trackVariantReads += 1;
							return { key: 'compound0', tag: 'key' as const };
						},
					},
					neutral: null,
				},
			},
		],
	});
	const xstyle = { root: compiledStyles.compound0 };

	const root = resolveRecipeSlotProps(built, 'root', undefined, xstyle.root);

	expect(trackVariantReads).toBe(0);
	expect(root).toEqual(built({ xstyle }).root);
	expect(trackVariantReads).toBe(1);
});

test('compiledStyleList preserves ordered references in every style-bearing position', async () => {
	const code = await expand(
		[
			PREAMBLE,
			"import { compiledStyleList as markList } from '../styles/recipe-authoring.js';",
			"import { inputGroupInputStates as inputStates, comboboxInputStates } from '../../styles/input-states.js';",
			'export const r = recipe({',
			'  slots: { control: [{ color: "red" }, ...markList(inputStates), { color: "blue" }] },',
			'  variants: { size: { small: { control: [...markList(comboboxInputStates)] } } },',
			'  compoundVariants: [{ size: "small", style: { control: [...markList(inputStates)] } }],',
			'});',
		].join('\n'),
	);
	expect(code).toContain('ref: inputStates');
	expect(code).toContain('ref: comboboxInputStates');
	expect(code).toContain('tag: "refs"');

	const single = await expand(
		[
			PREAMBLE,
			"import { compiledStyleList } from '../styles/recipe-authoring.js';",
			"import { inputGroupInputStates } from '../../styles/input-states.js';",
			'export const r = recipe({ base: [...compiledStyleList(inputGroupInputStates)] });',
		].join('\n'),
	);
	expect(single).toContain('ref: inputGroupInputStates');
});

test.each([
	["import { otherStates } from '../../styles/input-states.js';", 'otherStates'],
	["import { inputGroupInputStates } from '../unrelated.js';", 'inputGroupInputStates'],
	['const states = [{ color: "red" }];', 'states'],
])('rejects an array spread without compiledStyleList: %s', async (declaration, name) => {
	await expect(
		expand([PREAMBLE, declaration, `export const r = recipe({ base: [...${name}] });`].join('\n')),
	).rejects.toThrow('can spread only compiledStyleList(...)');
});

test.each([
	["import { visuallyHiddenStyle } from '../visually-hidden/recipe.js';", 'visuallyHiddenStyle'],
	["import { externalStyle } from '../shared/recipe.js';", 'externalStyle'],
])('rejects an imported style without a compiledStyle marker: %s', async (declaration, name) => {
	await expect(
		expand([PREAMBLE, declaration, `export const r = recipe({ base: ${name} });`].join('\n')),
	).rejects.toThrow('Unsupported style value at base');
});

test('rejects compiledStyleList outside an array spread and compiledStyle in a spread', async () => {
	await expect(
		expand(
			[
				PREAMBLE,
				"import { compiledStyleList, compiledStyle } from '../styles/recipe-authoring.js';",
				"import { externalStyle } from '../shared/recipe.js';",
				'export const r = recipe({ base: compiledStyleList(externalStyle) });',
			].join('\n'),
		),
	).rejects.toThrow('only in an array spread');

	await expect(
		expand(
			[
				PREAMBLE,
				"import { compiledStyle } from '../styles/recipe-authoring.js';",
				"import { externalStyles } from '../shared/recipe.js';",
				'export const r = recipe({ base: [...compiledStyle(externalStyles)] });',
			].join('\n'),
		),
	).rejects.toThrow('can spread only compiledStyleList(...)');
});

test('compiled array entries stay between their surrounding styles', () => {
	const shared = [compiledStyles.toneAccent, compiledStyles.compound0];
	const built = recipeFromCompiled(compiledStyles, {
		base: [
			{ key: 'base', tag: 'key' },
			{ ref: shared, tag: 'refs' },
			{ key: 'slotRoot', tag: 'key' },
		],
		compoundVariants: [],
		defaultVariants: {},
		variants: [],
	});
	expect(built()).toEqual(stylex.props(compiledStyles.base, ...shared, compiledStyles.slotRoot));
});

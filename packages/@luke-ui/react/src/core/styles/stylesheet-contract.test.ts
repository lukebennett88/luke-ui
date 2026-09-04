import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import type { Node } from 'oxc-parser';
import { parseSync } from 'oxc-parser';
import type { AtRule, Root, Rule } from 'postcss';
import { parse } from 'postcss';
import selectorParser from 'postcss-selector-parser';
import { expect, test } from 'vite-plus/test';
import { createStylexStylesheet } from '../../../stylex-vite-plugin.js';
import type { TypeStyle } from '../../theme/contract.js';
import { typeStyles } from '../../theme/contract.js';

const lukeOwnedLayerNames = ['reset', 'theme', 'base', 'recipes', 'utilities'] as const;
const lukeOwnedLayerNameSet = new Set<string>(lukeOwnedLayerNames);
const STYLEX_PRIORITY_LAYER_PATTERN = /^recipes\.priority\d+$/;

/** The stylesheet's leading `@layer ...;` order statement. */
const LAYER_ORDER_STATEMENT_PATTERN = /^@layer [^;]+;/m;
type TextClassesByTypography = Record<TypeStyle, Array<string>>;
const numericLineClampVariants = [2, 3, 4, 5] as const;
type NumericLineClampVariant = (typeof numericLineClampVariants)[number];
type LineClampClasses = {
	singleLine: Array<string>;
	numeric: Record<NumericLineClampVariant, Array<string>>;
};

test(
	'builds the public stylesheet with the retained layer contract',
	{ timeout: 30_000 },
	async () => {
		const stylesheet = await readPublicStylesheet();
		const text = await import('@luke-ui/react/text');
		const styles = await import('@luke-ui/react/styles');
		const root = parse(stylesheet);
		const recipeClasses = comboboxStylexClassesFromStylesheet(root);
		expect(recipeClasses.length).toBeGreaterThan(0);
		const textClassesByTypography = Object.fromEntries(
			typeStyles.map((typography) => [
				typography,
				text.textRecipe({ typography }).className?.split(' ') ?? [],
			]),
		) as TextClassesByTypography;
		const utilityClasses = styles.createSprinkles({ display: 'grid' }).className?.split(' ') ?? [];
		const lineClampClasses: LineClampClasses = {
			numeric: Object.fromEntries(
				numericLineClampVariants.map((lineClamp) => [
					lineClamp,
					text.textRecipe({ lineClamp }).className?.split(' ') ?? [],
				]),
			) as Record<NumericLineClampVariant, Array<string>>,
			singleLine: text.textRecipe({ lineClamp: true }).className?.split(' ') ?? [],
		};

		assertPrivateStylesheetSentinel(root);
		assertStylesheetContract(stylesheet, {
			lineClampClasses,
			recipeClasses,
			textClassesByTypography,
			utilityClasses,
		});
	},
);

test('authors logical camelCase property keys in StyleX styles', async () => {
	const sourceRoot = fileURLToPath(STYLEX_SOURCE_ROOT);
	const filenames = await findMigratedStylexSources(sourceRoot);
	expect(filenames.length).toBeGreaterThan(0);

	const sources = await Promise.all(
		filenames.map(async (filename) => ({ filename, source: await readFile(filename, 'utf8') })),
	);
	const errors: Array<string> = [];
	for (const { filename, source } of sources) {
		const relativeFilename = toSourceRelativePath(filename);
		const allowedPhysicalProperties = PHYSICAL_PROPERTY_EXCEPTIONS.get(relativeFilename);
		for (const key of collectStylexPropertyKeys(filename, source)) {
			if (PHYSICAL_PROPERTIES_WITH_LOGICAL_COUNTERPART.has(key)) {
				if (allowedPhysicalProperties?.has(key)) continue;
				errors.push(
					`${relativeFilename} uses physical StyleX key "${key}"; author its logical counterpart instead.`,
				);
			}
		}
	}
	expect(errors).toEqual([]);
});

test('uses no quoted kebab-case property keys in StyleX styles', async () => {
	const sourceRoot = fileURLToPath(STYLEX_SOURCE_ROOT);
	const filenames = await findMigratedStylexSources(sourceRoot);
	expect(filenames.length).toBeGreaterThan(0);

	const sources = await Promise.all(
		filenames.map(async (filename) => ({ filename, source: await readFile(filename, 'utf8') })),
	);
	const errors: Array<string> = [];
	for (const { filename, source } of sources) {
		for (const key of collectStylexStringPropertyKeys(filename, source)) {
			if (isStylexStyleObjectKey(key)) continue;
			errors.push(
				`${toSourceRelativePath(filename)} uses quoted property key "${key}"; StyleX treats a quoted kebab-case key as an unknown property, so author the camelCase key instead.`,
			);
		}
	}
	expect(errors).toEqual([]);
});

const stylesheetMutations: Array<[string, (css: string) => string]> = [
	['missing stable selector', (css: string) => css.replace('.luke-ui-theme', '.theme-root')],
	['extra stable selector', (css: string) => `${css}\n@layer theme { .luke-ui-extra {} }`],
	[
		'reordered authoritative layer declarations',
		(css: string) => {
			return css.replace(
				/^@layer reset, theme, base, recipes\.priority\d+(?:, recipes\.priority\d+)*, utilities;/m,
				'@layer theme, reset, base, recipes.priority1, utilities;',
			);
		},
	],
	[
		'early individual layer declarations before authoritative order',
		(css: string) => {
			return css.replace(
				/^@layer reset, theme, base, recipes\.priority\d+(?:, recipes\.priority\d+)*, utilities;\n/m,
				'@layer reset;\n@layer theme;\n@layer recipes;\n@layer utilities;\n@layer reset, theme, base, recipes.priority1, utilities;\n',
			);
		},
	],
	[
		'early layer block before authoritative order',
		(css: string) => {
			return css.replace(
				/^@layer reset, theme, base, recipes\.priority\d+(?:, recipes\.priority\d+)*, utilities;\n/m,
				'@layer recipes { .early {} }\n@layer reset, theme, base, recipes.priority1, utilities;\n',
			);
		},
	],
	['anonymous layer statement', (css: string) => `${css}\n@layer;`],
	['anonymous layer block', (css: string) => `${css}\n@layer { .anonymous {} }`],
	['unknown layer', (css: string) => `${css}\n@layer overlays;`],
	['nested layer', (css: string) => `${css}\n@layer recipes { @layer utilities {} }`],
	['root qualified rule', (css: string) => `${css}\n.root-rule { color: red; }`],
	['lookalike layer at-rule', (css: string) => `${css}\n@layered {}`],
	[
		'representative StyleX class moved to the wrong layer',
		(css: string) => {
			return css.replace(
				'@layer recipes.priority1 {\n  .xrecipe1a { display: inline-flex; }\n}',
				'@layer utilities {\n  .xrecipe1a { display: inline-flex; }\n}',
			);
		},
	],
	[
		'representative utility class moved to the wrong layer',
		(css: string) => {
			return css.replace(
				'@layer utilities {\n  ._utility1a { display: grid; }\n}',
				'@layer recipes {\n  ._utility1a { display: grid; }\n}',
			);
		},
	],
	[
		'representative retained-layer content removed',
		(css: string) => css.replace('  .xrecipe1a { display: inline-flex; }\n', ''),
	],
	[
		'class-like text in an attribute value',
		(css: string) => {
			return css.replace(
				'.xrecipe1a { display: inline-flex; }',
				'[data-class=".xrecipe1a"] { display: inline-flex; }',
			);
		},
	],
	[
		'redundant empty layer statements after authoritative order',
		(css: string) => {
			return css.replace(
				/^(@layer reset, theme, base, recipes\.priority\d+(?:, recipes\.priority\d+)*, utilities;\n)/m,
				'$1@layer recipes;\n',
			);
		},
	],
	['generic global class', (css: string) => `${css}\n@layer recipes { .prose {} }`],
	[
		'loading-skeleton global class',
		(css: string) => `${css}\n@layer recipes { .loading-skeleton {} }`,
	],
	[
		'combobox-section global class',
		(css: string) => `${css}\n@layer recipes { .combobox-section {} }`,
	],
];

for (const [name, mutate] of stylesheetMutations) {
	test(`rejects a stylesheet with a ${name}`, () => {
		expect(() => {
			return assertStylesheetContract(mutate(validStylesheetFixture), {
				recipeClasses: ['xrecipe1a'],
				utilityClasses: ['_utility1a'],
			});
		}).toThrow(/.+/);
	});
}

test('queries responsive conditions on the logical inline axis', async () => {
	const stylesheet = await readPublicStylesheet();

	expect(stylesheet).toContain('@container (inline-size >=');
	expect(stylesheet).not.toContain('@container (width >=');
});

/**
 * StyleX lowers a bidi-insensitive logical property to its physical equivalent, so
 * `blockSize` emits `height` and `marginBlockStart` emits `margin-top`. Those are equivalent
 * under the horizontal writing modes the design system supports, so this guard permits them
 * and asserts only on the direction-sensitive properties StyleX leaves logical. Emitting one
 * of those physically would mirror the wrong way round under `direction: rtl`.
 *
 * The guard is scoped to the StyleX priority layers because the same stylesheet retains
 * Vanilla Extract output and deliberately physical CSS, neither of which this contract owns.
 */
test('emits no physical direction-sensitive declarations from StyleX', async () => {
	const stylesheet = await readPublicStylesheet();
	const root = parse(stylesheet);
	const errors: Array<string> = [];

	root.walkRules((rule) => {
		const layer = getOwningLayer(rule);
		if (layer === undefined || !STYLEX_PRIORITY_LAYER_PATTERN.test(layer)) return;

		rule.walkDecls((declaration) => {
			const value = declaration.value.trim();
			if (PHYSICAL_DIRECTION_SENSITIVE_PROPERTIES.has(declaration.prop)) {
				errors.push(`${layer} ${rule.selector} emits physical "${declaration.prop}".`);
			}
			if (PHYSICAL_DIRECTION_SENSITIVE_VALUES.get(declaration.prop)?.has(value)) {
				errors.push(`${layer} ${rule.selector} emits physical "${declaration.prop}: ${value}".`);
			}
		});
	});

	expect(errors).toEqual([]);
});

test('emits direction-sensitive properties logically from StyleX', async () => {
	const root = parse(await readPublicStylesheet());
	const properties = new Set<string>();

	root.walkRules((rule) => {
		const layer = getOwningLayer(rule);
		if (layer === undefined || !STYLEX_PRIORITY_LAYER_PATTERN.test(layer)) return;
		rule.walkDecls((declaration) => {
			properties.add(declaration.prop);
		});
	});

	expect(properties).toContain('padding-inline-start');
	expect(properties).toContain('inset-inline-start');
});

test('recognises escaped class identifiers', () => {
	expect(() => {
		// `\61 ` is the CSS escape for `a`, so this authors `.xrecipea1a` with one character
		// escaped. The selector parser must decode it to recognise the class as a StyleX atom.
		return assertStylesheetContract(
			validStylesheetFixture.replaceAll('xrecipe1a', 'xrecipe\\61 1a'),
			{
				recipeClasses: ['xrecipea1a'],
				utilityClasses: ['_utility1a'],
			},
		);
	}).not.toThrow();
});

test(
	'declares the complete production layer order before dev StyleX rules load',
	{ timeout: 30_000 },
	async () => {
		const [builtStylesheet, devStylesheet] = await Promise.all([
			readPublicStylesheet(),
			createStylexStylesheet(false),
		]);

		expect(layerOrder(devStylesheet)).toBe(layerOrder(builtStylesheet));
	},
);

test(
	'excludes a Storybook story from the production StyleX scan but includes it in dev',
	{ timeout: 30_000 },
	async () => {
		// A unique atom and class name so this test cannot pass against rules another module in
		// `src` happens to emit.
		const storyFilename = fileURLToPath(
			new URL('./stylesheet-contract-story-probe.stories.tsx', import.meta.url),
		);
		const storySource = `
import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
	storyProbe: {
		textDecorationStyle: 'wavy',
	},
});

export const storyProbeClassName = stylex.props(styles.storyProbe).className;
`;

		await writeFile(storyFilename, storySource, 'utf8');
		try {
			const [productionStylesheet, devStylesheet] = await Promise.all([
				createStylexStylesheet(false),
				createStylexStylesheet(true),
			]);

			expect(productionStylesheet).not.toMatch(/text-decoration-style:\s*wavy/);
			expect(devStylesheet).toMatch(/text-decoration-style:\s*wavy/);
		} finally {
			await rm(storyFilename);
		}
	},
);

test('never emits !important from a recipes.priorityN sublayer', { timeout: 30_000 }, async () => {
	// Cascade-layer priority reverses for `!important` declarations: a nested sublayer (like
	// StyleX's own `recipes.priorityN`) beats its direct parent layer for `!important`, which
	// is the OPPOSITE of the normal-declaration ordering the rest of this cascade relies on
	// (a direct `@layer recipes` rule beating a nested `recipes.priorityN` rule). Retained CSS
	// that needs to forcibly win — LoadingSkeleton's forced surface, for instance — depends on
	// being written directly into `@layer recipes` rather than into a StyleX sublayer, and on a
	// consumer's `overrides` layer being able to out-rank it in turn. If a `recipes.priorityN`
	// sublayer ever emits `!important`, that declaration would rank ABOVE both the direct
	// `@layer recipes` retained CSS and a consumer's `@layer overrides !important` override,
	// silently inverting the whole override contract. See `styles.css.ts` in
	// `core/loading-skeleton` for the retained CSS this invariant protects.
	const stylesheet = await readPublicStylesheet();
	const root = parse(stylesheet);

	// `recipes.priorityN` can appear as more than one block in the built stylesheet (StyleX
	// emits per-source-chunk blocks that share a layer name), so every block for a given
	// layer name must be aggregated rather than stopping at the first match.
	const importantDeclarationsByLayer = new Map<string, Array<string>>();

	root.walkAtRules('layer', (atRule) => {
		const name = atRule.params.trim();
		if (!STYLEX_PRIORITY_LAYER_PATTERN.test(name)) return;

		atRule.walkDecls((declaration) => {
			if (!declaration.important) return;
			const descriptions = importantDeclarationsByLayer.get(name) ?? [];
			descriptions.push(`${declaration.prop}: ${declaration.value} !important`);
			importantDeclarationsByLayer.set(name, descriptions);
		});
	});

	const summary = [...importantDeclarationsByLayer.entries()]
		.map(([layer, declarations]) => `  @layer ${layer}: ${declarations.join(', ')}`)
		.join('\n');

	// A failure here means a `recipes.priorityN` sublayer emitted `!important`. Cascade-layer
	// `!important` priority is the reverse of normal-declaration priority: a nested sublayer beats
	// its direct parent layer for `!important`, while a direct parent layer beats a nested sublayer
	// for normal declarations. Luke UI relies on the normal-declaration ordering to let retained CSS,
	// written directly into `@layer recipes` (not a StyleX sublayer), reliably override generated
	// recipe output — and to let a consumer's `@layer overrides` reliably override Luke UI's own
	// `@layer recipes`. Any `!important` inside a `recipes.priorityN` sublayer would rank ABOVE both,
	// inverting the override contract. Move the forced style into retained CSS (a
	// `globalStyleInLayer('recipes', ...)` call) instead of authoring it in `stylex.create`.
	expect(summary).toBe('');
});

function layerOrder(stylesheet: string): string {
	const order = stylesheet.match(LAYER_ORDER_STATEMENT_PATTERN)?.[0];
	if (order === undefined) throw new Error('Expected a cascade-layer order statement.');
	return order;
}

async function readPublicStylesheet(): Promise<string> {
	return readFile(new URL('../../../dist/stylesheet.css', import.meta.url), 'utf8');
}

const STYLEX_ELIGIBLE_MODULE_PATTERN = /(?<!\.d)\.[cm]?[jt]sx?$/;
const GENERATED_OR_TEST_MODULE_PATTERN = /\.(?:browser|visual|test)\.[cm]?[jt]sx?$/;

async function findMigratedStylexSources(directory: string): Promise<Array<string>> {
	const entries = await readdir(directory, { withFileTypes: true });
	const filenames = await Promise.all(
		entries.map(async (entry) => {
			const filename = join(directory, entry.name);
			if (entry.isDirectory()) return findMigratedStylexSources(filename);
			if (!STYLEX_ELIGIBLE_MODULE_PATTERN.test(filename)) return [];
			if (filename.endsWith('.css.ts')) return [];
			if (GENERATED_OR_TEST_MODULE_PATTERN.test(filename)) return [];
			const source = await readFile(filename, 'utf8');
			if (!source.includes('@stylexjs/stylex') || !source.includes('stylex.create')) return [];
			return [filename];
		}),
	);
	return filenames.flat();
}

/** Physical authoring keys that have a direct logical counterpart to author instead. */
const PHYSICAL_PROPERTIES_WITH_LOGICAL_COUNTERPART = new Set([
	'width',
	'height',
	'minWidth',
	'minHeight',
	'maxWidth',
	'maxHeight',
	'marginTop',
	'marginBottom',
	'marginLeft',
	'marginRight',
	'paddingTop',
	'paddingBottom',
	'paddingLeft',
	'paddingRight',
	'top',
	'bottom',
	'left',
	'right',
	'borderTopWidth',
	'borderTopStyle',
	'borderTopColor',
	'borderBottomWidth',
	'borderBottomStyle',
	'borderBottomColor',
	'borderLeftWidth',
	'borderLeftStyle',
	'borderLeftColor',
	'borderRightWidth',
	'borderRightStyle',
	'borderRightColor',
	'borderTopLeftRadius',
	'borderTopRightRadius',
	'borderBottomLeftRadius',
	'borderBottomRightRadius',
	'scrollMarginTop',
	'scrollMarginBottom',
	'scrollMarginLeft',
	'scrollMarginRight',
	'scrollPaddingTop',
	'scrollPaddingBottom',
	'scrollPaddingLeft',
	'scrollPaddingRight',
]);

/**
 * Modules permitted to author a specific physical property, keyed by their path relative to
 * `src`. Each entry needs a comment naming the reason the physical property is correct, and
 * the call site itself needs the same explanation. Adding an entry here is a deliberate
 * exception to the logical-authoring contract, never a way to quieten the test.
 */
const PHYSICAL_PROPERTY_EXCEPTIONS = new Map<string, Set<string>>([
	// The tray pairs `top` and `bottom` to preserve an intended over-constraint that logical
	// block insets would resolve from the wrong edge on a content-box element.
	['core/overlays/mobile-overlay.tsx', new Set(['top', 'bottom'])],
]);

/** Physical direction-sensitive properties StyleX leaves logical, so emitting one is a bug. */
const PHYSICAL_DIRECTION_SENSITIVE_PROPERTIES = new Set([
	'margin-left',
	'margin-right',
	'padding-left',
	'padding-right',
	'left',
	'right',
	'border-left-width',
	'border-left-style',
	'border-left-color',
	'border-right-width',
	'border-right-style',
	'border-right-color',
	'border-top-left-radius',
	'border-top-right-radius',
	'border-bottom-left-radius',
	'border-bottom-right-radius',
	'scroll-margin-left',
	'scroll-margin-right',
	'scroll-padding-left',
	'scroll-padding-right',
]);

/** Physical direction-sensitive *values*, which mirror the wrong way round under `direction: rtl`. */
const PHYSICAL_DIRECTION_SENSITIVE_VALUES = new Map<string, Set<string>>([
	['text-align', new Set(['left', 'right'])],
	['float', new Set(['left', 'right'])],
	['clear', new Set(['left', 'right'])],
]);

/** The scanned source root, matching the directory `findMigratedStylexSources` walks. */
const STYLEX_SOURCE_ROOT = new URL('../..', import.meta.url);

function toSourceRelativePath(filename: string): string {
	return relative(fileURLToPath(STYLEX_SOURCE_ROOT), filename);
}

/** Every property key authored inside a `stylex.create()` style object, quoted or not. */
function collectStylexPropertyKeys(filename: string, source: string): Array<string> {
	return collectStylexKeys(filename, source).map(({ name }) => name);
}

/** Only the string-literal property keys, which is where a quoted kebab-case key would appear. */
function collectStylexStringPropertyKeys(filename: string, source: string): Array<string> {
	return collectStylexKeys(filename, source)
		.filter(({ quoted }) => quoted)
		.map(({ name }) => name);
}

interface StylexPropertyKey {
	name: string;
	quoted: boolean;
}

/**
 * Walks the module for `stylex.create()` calls and returns the property keys of the style
 * objects inside them, including keys nested under a selector, at-rule, or conditional value
 * object. Keys elsewhere in the module — component props, recipe variant maps, Vanilla Extract
 * definitions — are deliberately out of scope.
 */
function collectStylexKeys(filename: string, source: string): Array<StylexPropertyKey> {
	const parsed = parseSync(filename, source, { lang: 'tsx' });
	if (parsed.errors.length > 0) {
		throw new Error(`Could not parse ${filename}: ${parsed.errors[0]?.message}`);
	}

	const keys: Array<StylexPropertyKey> = [];
	for (const call of findStylexCreateCalls(parsed.program)) {
		for (const argument of call.arguments) {
			if (argument.type !== 'ObjectExpression') continue;
			// The argument maps namespace names to style objects, so its own keys are namespace
			// names rather than CSS properties. Only the style objects below it are inspected.
			for (const namespace of argument.properties) {
				if (namespace.type !== 'Property') continue;
				for (const styleObject of styleObjects(namespace.value)) {
					collectStyleObjectKeys(styleObject, keys);
				}
			}
		}
	}
	return keys;
}

function findStylexCreateCalls(program: Node): Array<Extract<Node, { type: 'CallExpression' }>> {
	const calls: Array<Extract<Node, { type: 'CallExpression' }>> = [];
	walkNodes(program, (node) => {
		if (node.type !== 'CallExpression') return;
		const { callee } = node;
		if (callee.type !== 'MemberExpression' || callee.computed) return;
		if (callee.object.type !== 'Identifier' || callee.object.name !== 'stylex') return;
		if (callee.property.type !== 'Identifier' || callee.property.name !== 'create') return;
		calls.push(node);
	});
	return calls;
}

/** A namespace value is either a style object or a dynamic style returning one. */
function styleObjects(node: Node): Array<Extract<Node, { type: 'ObjectExpression' }>> {
	if (node.type === 'ObjectExpression') return [node];
	if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
		const body = node.body;
		if (body === null) return [];
		const objects: Array<Extract<Node, { type: 'ObjectExpression' }>> = [];
		walkNodes(body, (descendant) => {
			if (descendant.type === 'ObjectExpression') objects.push(descendant);
		});
		return objects;
	}
	return [];
}

function collectStyleObjectKeys(
	object: Extract<Node, { type: 'ObjectExpression' }>,
	keys: Array<StylexPropertyKey>,
): void {
	for (const property of object.properties) {
		if (property.type !== 'Property') continue;
		const key = stylexPropertyKey(property.key, property.computed);
		if (key !== undefined) keys.push(key);
		// A selector, at-rule, or conditional value object nests more property keys.
		if (property.value.type === 'ObjectExpression') {
			collectStyleObjectKeys(property.value, keys);
		}
	}
}

function stylexPropertyKey(key: Node, computed: boolean): StylexPropertyKey | undefined {
	if (computed) return undefined;
	if (key.type === 'Identifier') return { name: key.name, quoted: false };
	if (key.type === 'Literal' && typeof key.value === 'string') {
		return { name: key.value, quoted: true };
	}
}

const KEYFRAME_SELECTOR_PATTERN = /^(?:from|to|\d+(?:\.\d+)?%)$/;

/** True for a quoted key that names something other than a CSS property. */
function isStylexStyleObjectKey(key: string): boolean {
	if (key.startsWith('--')) return true;
	if (key.startsWith('@')) return true;
	if (key.startsWith(':') || key.startsWith('&') || key.startsWith('[')) return true;
	if (key.includes('::')) return true;
	return KEYFRAME_SELECTOR_PATTERN.test(key);
}

function walkNodes(node: Node, visit: (node: Node) => void): void {
	visit(node);
	for (const value of Object.values(node)) {
		if (Array.isArray(value)) {
			for (const item of value) {
				if (isNode(item)) walkNodes(item, visit);
			}
			continue;
		}
		if (isNode(value)) walkNodes(value, visit);
	}
}

function isNode(value: unknown): value is Node {
	return (
		typeof value === 'object' && value !== null && typeof Reflect.get(value, 'type') === 'string'
	);
}

function assertStylesheetContract(
	stylesheet: string,
	{
		lineClampClasses,
		recipeClasses,
		textClassesByTypography,
		utilityClasses,
	}: {
		lineClampClasses?: LineClampClasses;
		recipeClasses: Array<string>;
		textClassesByTypography?: TextClassesByTypography;
		utilityClasses: Array<string>;
	},
): void {
	const root = parse(stylesheet);

	assertEffectiveLayerCreationOrder(root);
	assertNoRedundantEmptyLayerStatements(stylesheet);
	assertAuthoritativeLayerOrder(getAuthoritativeLayerOrder(root));
	assertLayerNames(root);
	assertRootNodes(root);
	assertStableSelectors(root);
	assertSentinel(root, 'luke-ui-reset', 'reset', 'box-sizing', 'border-box');
	assertSentinel(root, 'luke-ui-theme', 'theme', 'color', 'var(--luke-color-text-primary)');
	assertSentinel(
		root,
		'luke-ui-theme',
		'theme',
		'font-family',
		'var(--luke-font-body-font-family)',
	);
	assertSentinel(root, 'luke-ui-theme', 'theme', 'font-size', 'var(--luke-font-body-font-size)');

	for (const className of recipeClasses) assertStylexClassOwnership(root, className);
	for (const className of utilityClasses) assertClassOwnership(root, className, 'utilities');
	if (textClassesByTypography) assertTextTrimOwnership(root, textClassesByTypography);
	if (lineClampClasses) assertLineClampOwnership(root, lineClampClasses);
}

/**
 * LoadingSkeleton's inline root (`[data-skeleton-inline]`) carries TWO rules: an ordinary,
 * non-`!important` StyleX rule (`borderRadius`, in a `recipes.priorityN` sublayer) and a retained
 * forced `!important` surface written directly into `@layer recipes` (see
 * `core/loading-skeleton/styles.css.ts`). Both are asserted here; the forced surface must NOT be
 * in a StyleX sublayer, because a `!important` declaration in `recipes.priorityN` would rank above
 * this direct-`recipes` retained CSS — see the `!important`-in-`recipes.priorityN` guard test.
 */
function assertPrivateStylesheetSentinel(root: Root): void {
	const inlineRules = collectSkeletonInlineRules(root);
	expect(inlineRules.length).toBeGreaterThan(0);

	// Partition by owning layer, not by declaration content: the retained forced surface splits
	// across more than one rule (the base surface, the forced-colors override, and the
	// reduced-motion override each land in their own `@media`-scoped rule), and only the base
	// surface rule carries the forced background-color declaration a content sniff could match.
	const directRecipesRules = inlineRules.filter((rule) => getOwningLayer(rule) === 'recipes');
	const stylexSublayerRules = inlineRules.filter((rule) => {
		const layer = getOwningLayer(rule);
		return layer !== undefined && STYLEX_PRIORITY_LAYER_PATTERN.test(layer);
	});
	expect(directRecipesRules.length + stylexSublayerRules.length).toBe(inlineRules.length);

	// The retained forced `!important` surface lives directly in `@layer recipes`, never a
	// `recipes.priorityN` sublayer.
	expect(directRecipesRules.length).toBeGreaterThan(0);
	expect(
		directRecipesRules.some((rule) => {
			return rule.nodes.some(
				(node) =>
					node.type === 'decl' &&
					node.prop === 'background-color' &&
					node.value === 'var(--luke-color-loading-skeleton)' &&
					node.important,
			);
		}),
	).toBe(true);

	// The ordinary, non-`!important` StyleX styling (e.g. `borderRadius`) stays in a
	// `recipes.priorityN` sublayer.
	expect(stylexSublayerRules.length).toBeGreaterThan(0);

	const maskRules = collectSkeletonDescendantMaskRules(root);
	expect(maskRules.length).toBeGreaterThan(0);
	for (const rule of maskRules) expect(getOwningLayer(rule)).toBe('recipes');
}

function collectSkeletonInlineRules(root: Root): Array<Rule> {
	const rules: Array<Rule> = [];
	root.walkRules((rule) => {
		if (hasAttributeSelector(rule, 'data-skeleton-inline')) rules.push(rule);
	});
	return rules;
}

function collectSkeletonDescendantMaskRules(root: Root): Array<Rule> {
	const rules: Array<Rule> = [];
	root.walkRules((rule) => {
		if (!rule.selector.includes('data-skeleton-inline')) return;
		if (!rule.selector.includes('> *')) return;
		if (
			rule.nodes.some(
				(node) =>
					node.type === 'decl' &&
					node.prop === 'background-color' &&
					node.value === 'var(--luke-color-loading-skeleton)' &&
					node.important,
			)
		) {
			rules.push(rule);
		}
	});
	return rules;
}

function hasAttributeSelector(rule: Rule, attribute: string): boolean {
	let matches = false;
	selectorParser((selectors) => {
		selectors.walkAttributes((attributeNode) => {
			if (attributeNode.attribute !== attribute) return;

			let parent = attributeNode.parent;
			while (parent) {
				if (parent.type === 'pseudo' && parent.value === ':not') return;
				parent = parent.parent;
			}

			matches = true;
		});
	}).processSync(rule.selector);
	return matches;
}

function getAuthoritativeLayerOrder(root: Root): Array<string> {
	for (const node of root.nodes) {
		if (node.type !== 'atrule' || node.name !== 'layer' || node.nodes) continue;
		const params = node.params.trim();
		if (!params.includes(',')) continue;

		return params.split(',').map((name) => name.trim());
	}

	throw new Error('Expected an authoritative combined cascade-layer order statement.');
}

function assertEffectiveLayerCreationOrder(root: Root): void {
	let sawAuthoritativeOrder = false;

	for (const node of root.nodes) {
		if (node.type !== 'atrule' || node.name !== 'layer') continue;

		const params = node.params.trim();
		const isCombinedOrder = !node.nodes && params.includes(',');

		if (isCombinedOrder) {
			if (!sawAuthoritativeOrder) {
				sawAuthoritativeOrder = true;
				continue;
			}

			throw new Error(
				'Expected a single authoritative combined cascade-layer order statement at the start of the stylesheet.',
			);
		}

		if (!sawAuthoritativeOrder) {
			throw new Error(
				`Layer "${params}" was created before the authoritative combined cascade-layer order statement.`,
			);
		}
	}

	if (!sawAuthoritativeOrder) {
		throw new Error('Expected an authoritative combined cascade-layer order statement.');
	}
}

function assertNoRedundantEmptyLayerStatements(stylesheet: string): void {
	const lines = stylesheet.split('\n');
	for (let index = 1; index < lines.length; index++) {
		const line = lines[index]?.trim();
		if (line == null || line === '') continue;
		if (/^@layer [^,{]+;$/.test(line)) {
			throw new Error(`Redundant empty layer statement after authoritative order: ${line}`);
		}
	}
}

function assertAuthoritativeLayerOrder(order: Array<string>): void {
	expect(order[0]).toBe('reset');
	expect(order[1]).toBe('theme');
	expect(order[2]).toBe('base');

	const priorityLayers = order.slice(3).filter((name) => STYLEX_PRIORITY_LAYER_PATTERN.test(name));
	expect(priorityLayers.length).toBeGreaterThan(0);
	expect(priorityLayers.every((name, index) => name === `recipes.priority${index + 1}`)).toBe(true);

	expect(order.slice(3 + priorityLayers.length)).toEqual(['utilities']);
}

function assertLayerNames(root: Root): void {
	root.walkAtRules('layer', (atRule) => {
		if (atRule.parent?.type !== 'root')
			throw atRule.error('Nested cascade layers are not allowed.');

		const names = getLayerNames(atRule);
		if (atRule.nodes && names.length !== 1) {
			throw atRule.error('Layer blocks must have exactly one name.');
		}

		for (const name of names) {
			if (lukeOwnedLayerNameSet.has(name) || STYLEX_PRIORITY_LAYER_PATTERN.test(name)) continue;
			throw atRule.error(`Unexpected cascade layer: ${name}`);
		}
	});
}

function getLayerNames(atRule: AtRule): Array<string> {
	const params = atRule.params.trim();
	if (!params) throw atRule.error('Anonymous cascade layers are not allowed.');

	return params.split(',').map((name) => name.trim());
}

function assertRootNodes(root: Root): void {
	for (const node of root.nodes) {
		if (node.type === 'comment') continue;
		if (node.type === 'rule') {
			if (isStylexCustomPropertyRule(node)) continue;
			throw node.error('Root qualified rules are not allowed.');
		}
		if (node.type !== 'atrule') throw node.error('Unexpected root stylesheet node.');
		if (node.name === 'layer') continue;
		if (node.name === 'property') continue;
		if (node.name === 'keyframes' && node.nodes) continue;

		throw node.error(`Unexpected root at-rule: @${node.name}`);
	}
}

/** StyleX emits custom-property atoms outside cascade layers. */
function isStylexCustomPropertyRule(rule: Rule): boolean {
	if (rule.nodes.length === 0) return false;
	return rule.nodes.every((node) => node.type === 'decl' && node.prop.startsWith('--'));
}

/** Every unhashed class name the built stylesheet is allowed to ship. */
const STABLE_SELECTORS = ['.luke-ui-prose', '.luke-ui-reset', '.luke-ui-theme'];

/** A StyleX atom class, e.g. `x3wd24` or `xcooxot`. StyleX does not hyphenate or capitalise these. */
const STYLEX_ATOM_CLASS_PATTERN = /^x[a-z0-9]+$/;

/** A Vanilla Extract class hash, e.g. `_64ob06` or `_64ob01i`. */
const VANILLA_EXTRACT_HASH_CLASS_PATTERN = /^_[a-z0-9]+$/;

function assertStableSelectors(root: Root): void {
	const selectors = new Set<string>();
	root.walkRules((rule) => {
		for (const className of getClassNames(rule)) {
			if (STYLEX_ATOM_CLASS_PATTERN.test(className)) continue;
			if (VANILLA_EXTRACT_HASH_CLASS_PATTERN.test(className)) continue;
			selectors.add(`.${className}`);
		}
	});

	// Every class StyleX and Vanilla Extract hash is exempt, because a build tool renaming its own
	// hash cannot break a consumer. Anything left over is unhashed and therefore part of the
	// stylesheet's shipped stable-selector surface, so it must appear in `STABLE_SELECTORS` above.
	// `luke-ui-reset` and `luke-ui-theme` are the documented roots a consumer applies; `luke-ui-prose`
	// is a private marker bridging Prose's public class-string recipe to its retained rules, so it
	// can be neither hashed nor an attribute. Adding a name here makes it part of the shipped
	// selector surface, so it must be a deliberate choice. Asserted as a subset because fixtures
	// exercise only some of these.
	for (const selector of selectors) {
		expect(STABLE_SELECTORS, `Unexpected unhashed selector shipped: ${selector}`).toContain(
			selector,
		);
	}
}

function assertSentinel(
	root: Root,
	className: string,
	layerName: string,
	property: string,
	value: string,
): void {
	const rules = getRulesForClass(root, className);
	expect(rules.length).toBeGreaterThan(0);
	for (const rule of rules) expect(getOwningLayer(rule)).toBe(layerName);
	expect(
		rules.some((rule) => {
			return rule.nodes.some(
				(node) => node.type === 'decl' && node.prop === property && node.value === value,
			);
		}),
	).toBe(true);
}

function assertStylexClassOwnership(root: Root, className: string): void {
	const rules = getRulesForClass(root, className);
	expect(rules.length).toBeGreaterThan(0);
	for (const rule of rules) {
		const layer = getOwningLayer(rule);
		expect(layer !== undefined && STYLEX_PRIORITY_LAYER_PATTERN.test(layer)).toBe(true);
	}
	expect(rules.some((rule) => rule.nodes.some((node) => node.type === 'decl'))).toBe(true);
}

function assertClassOwnership(root: Root, className: string, layerName: string): void {
	const rules = getRulesForClass(root, className);
	expect(rules.length).toBeGreaterThan(0);
	for (const rule of rules) expect(getOwningLayer(rule)).toBe(layerName);
	expect(rules.some((rule) => rule.nodes.some((node) => node.type === 'decl'))).toBe(true);
}

/**
 * Text is StyleX-migrated: its trim and line-clamp classes live in a `recipes.priorityN`
 * layer. `assertTextTrimOwnership` and `assertLineClampOwnership` below assert that StyleX
 * ownership directly. Text authors the logical `marginBlockStart`/`marginBlockEnd` keys, which
 * StyleX canonicalises to `margin-top`/`margin-bottom`. Both are bidi-insensitive, so the
 * physical output is equivalent under the horizontal writing modes the design system supports.
 */
function assertTextTrimOwnership(
	root: Root,
	textClassesByTypography: TextClassesByTypography,
): void {
	for (const typography of typeStyles) {
		const rules = textClassesByTypography[typography].flatMap((className) =>
			getRulesForClass(root, className),
		);
		assertPseudoDeclaration(
			rules,
			'::before',
			'margin-bottom',
			`var(--luke-font-${typography}-cap-height-trim)`,
		);
		assertPseudoDeclaration(
			rules,
			'::after',
			'margin-top',
			`var(--luke-font-${typography}-baseline-trim)`,
		);
	}
}

function assertLineClampOwnership(root: Root, { numeric, singleLine }: LineClampClasses): void {
	const singleLineRules = singleLine.flatMap((className) => getRulesForClass(root, className));
	assertStylexDeclaration(singleLineRules, 'display', 'block');
	assertStylexDeclaration(singleLineRules, 'text-overflow', 'ellipsis');
	assertStylexDeclaration(singleLineRules, 'white-space', 'nowrap');

	for (const lineClamp of numericLineClampVariants) {
		const rules = numeric[lineClamp].flatMap((className) => getRulesForClass(root, className));
		assertStylexDeclaration(rules, 'display', '-webkit-box');
		assertStylexDeclaration(rules, '-webkit-box-orient', 'vertical');
		assertStylexDeclaration(rules, '-webkit-line-clamp', String(lineClamp));
		assertStylexDeclaration(rules, 'line-clamp', String(lineClamp));
	}
}

function assertStylexDeclaration(rules: Array<Rule>, property: string, value: string): void {
	const matchingRules = rules.filter((rule) => {
		return rule.nodes.some(
			(node) => node.type === 'decl' && node.prop === property && node.value === value,
		);
	});
	expect(matchingRules.length).toBeGreaterThan(0);
	for (const rule of matchingRules) {
		const layer = getOwningLayer(rule);
		expect(layer !== undefined && STYLEX_PRIORITY_LAYER_PATTERN.test(layer)).toBe(true);
	}
}

function assertPseudoDeclaration(
	rules: Array<Rule>,
	pseudo: string,
	property: string,
	value: string,
): void {
	const matchingRules = rules.filter((rule) => {
		return (
			hasPseudo(rule, pseudo) &&
			rule.nodes.some(
				(node) => node.type === 'decl' && node.prop === property && node.value === value,
			)
		);
	});
	expect(matchingRules.length).toBeGreaterThan(0);
	for (const rule of matchingRules) {
		const layer = getOwningLayer(rule);
		expect(layer !== undefined && STYLEX_PRIORITY_LAYER_PATTERN.test(layer)).toBe(true);
	}
}

function comboboxStylexClassesFromStylesheet(root: Root): Array<string> {
	const classNames = new Set<string>();
	root.walkRules((rule) => {
		const layer = getOwningLayer(rule);
		if (layer === undefined || !STYLEX_PRIORITY_LAYER_PATTERN.test(layer)) return;
		const isComboboxClosedTriggerFloor = rule.nodes.some(
			(node) =>
				node.type === 'decl' &&
				node.value === 'calc(20ch + var(--luke-control-size-combobox-action))',
		);
		if (!isComboboxClosedTriggerFloor) return;
		for (const className of getClassNames(rule)) classNames.add(className);
	});
	return [...classNames];
}

function getRulesForClass(root: Root, className: string): Array<Rule> {
	const rules: Array<Rule> = [];
	root.walkRules((rule) => {
		if (getClassNames(rule).has(className)) rules.push(rule);
	});
	return rules;
}

function getClassNames(rule: Rule): Set<string> {
	const classNames = new Set<string>();
	selectorParser((selectors) => {
		selectors.walkClasses((classNode) => {
			classNames.add(classNode.value);
		});
	}).processSync(rule.selector);
	return classNames;
}

function hasPseudo(rule: Rule, pseudo: string): boolean {
	let hasMatchingPseudo = false;
	selectorParser((selectors) => {
		selectors.walkPseudos((pseudoNode) => {
			if (pseudoNode.value === pseudo) hasMatchingPseudo = true;
		});
	}).processSync(rule.selector);
	return hasMatchingPseudo;
}

function getOwningLayer(rule: Rule): string | undefined {
	let parent = rule.parent;
	while (parent && parent.type !== 'root') {
		if (parent.type === 'atrule' && parent.name === 'layer') return parent.params.trim();
		parent = parent.parent;
	}
	return undefined;
}

const validStylesheetFixture = `@layer reset, theme, base, recipes.priority1, utilities;
@layer reset {
  .luke-ui-reset { box-sizing: border-box; }
}
@layer theme {
  .luke-ui-theme {
    color: var(--luke-color-text-primary);
    font-family: var(--luke-font-body-font-family);
    font-size: var(--luke-font-body-font-size);
  }
}
@layer recipes {
  ._recipes1a { margin-block-start: 1px; }
}
@layer utilities {
  ._utility1a { display: grid; }
}
@layer recipes.priority1 {
  .xrecipe1a { display: inline-flex; }
}
@layer recipes.priority1 {
  .xstylex1a { outline-color: transparent; }
}
@keyframes generated-animation {
  from { opacity: 0; }
  to { opacity: 1; }
}`;

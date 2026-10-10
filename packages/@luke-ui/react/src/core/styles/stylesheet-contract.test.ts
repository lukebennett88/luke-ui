import { transform } from 'lightningcss';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';
import { capsizeTrimVarName } from '../../theme/capsize-trim-vars.js';
import type { TypeStyle } from '../../theme/type-styles.js';
import { typeStyles } from '../../theme/type-styles.js';
import { cascadeLayerOrder } from './layer-names.js';

/** Every layer the stylesheet may name, in precedence order. */
const layerOrder = ['base', 'luke-ui', 'luke-ui.reset', 'luke-ui.recipes', 'luke-ui.utilities'];
const layerNameSet = new Set<string>(layerOrder);
const RESET_LAYER_BLOCK_PATTERN = /^@layer luke-ui\.reset \{\n([\s\S]*?)\n\}$/m;

/**
 * The whole global stylesheet, as built. Every other rule belongs to a component. See
 * `research/717-global-stylesheet-contract.md` before changing it.
 */
const globalRules = `  :where(*), :where(*)::before, :where(*)::after {
    box-sizing: border-box;
  }
  :where(:root) {
    container-type: inline-size;
  }
  :where(body) {
    accent-color: var(--luke-color-background-accent-solid-rest);
    background-color: var(--luke-color-surface-base);
    color: var(--luke-color-text-primary);
    font-family: var(--luke-font-body-font-family);
    font-size: var(--luke-font-body-font-size);
    font-weight: var(--luke-font-body-font-weight);
    letter-spacing: var(--luke-font-body-letter-spacing);
    line-height: 1.5;
    margin: 0;
  }
  :where(body [data-color-mode='light'], body [data-color-mode='dark']) {
    accent-color: var(--luke-color-background-accent-solid-rest);
    background-color: var(--luke-color-surface-base);
    color: var(--luke-color-text-primary);
  }
  :where(button, input, select, textarea) {
    font: inherit;
    margin: 0;
  }
  :where(:focus-visible) {
    outline-color: var(--luke-color-border-focus);
    outline-offset: 2px;
    outline-style: solid;
    outline-width: 2px;
  }
  @media (forced-colors: active) {
    :where(:focus-visible) {
      outline-color: Highlight;
    }
  }`;
type TextClassesByTypography = Record<TypeStyle, Array<string>>;
const numericLineClampVariants = [2, 3, 4, 5] as const;
type NumericLineClampVariant = (typeof numericLineClampVariants)[number];
type LineClampClasses = {
	singleLine: Array<string>;
	numeric: Record<NumericLineClampVariant, Array<string>>;
};

type CssRule = {
	type: string;
	value: Record<string, unknown>;
};

type StyleRule = {
	selectors: Array<Array<SelectorComponent>>;
	declarations: {
		declarations: Array<Declaration>;
		importantDeclarations: Array<Declaration>;
	};
	rules: Array<CssRule>;
};

type SelectorComponent = {
	type: string;
	name?: string;
	kind?: string;
	value?: string;
	selectors?: Array<Array<SelectorComponent>>;
};

type Declaration = {
	property: string;
	value: unknown;
	vendorPrefix?: Array<string>;
};

type IndexedStyleRule = {
	rule: StyleRule;
	owningLayer: string | undefined;
	classNames: Set<string>;
	hasAttribute: (attribute: string) => boolean;
	mentionsAttribute: (attribute: string) => boolean;
	hasChildUniversal: boolean;
	hasPseudo: (pseudo: 'before' | 'after') => boolean;
	hasDeclarations: boolean;
};

type StylesheetAnalysis = {
	rootRules: Array<CssRule>;
	styleRules: Array<IndexedStyleRule>;
	rulesByClass: Map<string, Array<IndexedStyleRule>>;
};

test('builds the public stylesheet with the layer contract', async () => {
	const stylesheet = await readPublicStylesheet();
	const icon = await import('@luke-ui/react/icon');
	const text = await import('@luke-ui/react/text');
	const recipeClasses = [...icon.iconRecipe({ size: 'medium' }).split(' ')];
	const textClassesByTypography = Object.fromEntries(
		typeStyles.map((typography) => [typography, text.textRecipe({ typography }).split(' ')]),
	) as TextClassesByTypography;
	// Source `createSprinkles` can emit different hashes than the built stylesheet. Read a
	// representative utilities-layer class from the stylesheet itself.
	const utilityClasses = representativeUtilityClasses(stylesheet);
	const lineClampClasses: LineClampClasses = {
		numeric: Object.fromEntries(
			numericLineClampVariants.map((lineClamp) => [
				lineClamp,
				text.textRecipe({ lineClamp }).split(' '),
			]),
		) as Record<NumericLineClampVariant, Array<string>>,
		singleLine: text.textRecipe({ lineClamp: true }).split(' '),
	};

	expect(() => {
		const analysis = analyzeStylesheet(stylesheet);
		assertPrivateStylesheetSentinel(analysis);
		return assertStylesheetContract(stylesheet, {
			analysis,
			lineClampClasses,
			recipeClasses,
			textClassesByTypography,
			utilityClasses,
		});
	}).not.toThrow();
});

const stylesheetMutations: Array<[string, (css: string) => string]> = [
	[
		'reordered top-level layers',
		(css: string) => css.replace('@layer base, luke-ui;', '@layer luke-ui, base;'),
	],
	[
		'reordered Luke UI layers',
		(css: string) => {
			return css.replace('@layer reset, recipes, utilities;', '@layer reset, utilities, recipes;');
		},
	],
	[
		'layer created before the order statement',
		(css: string) => `@layer luke-ui.utilities;\n${css}`,
	],
	['unknown layer', (css: string) => `${css}\n@layer components;`],
	['flat Luke UI layer', (css: string) => `${css}\n@layer recipes { .x { color: red; } }`],
	[
		'declaration in the consumer base layer',
		(css: string) => `${css}\n@layer base { .x { color: red; } }`,
	],
	[
		'root class selector',
		(css: string) => `${css}\n@layer luke-ui.recipes { .luke-ui-theme { color: red; } }`,
	],
	[
		'extra global rule',
		(css: string) =>
			css.replace(
				'    margin: 0;\n  }\n  :where(:focus-visible)',
				'    margin: 0;\n  }\n  :where(ul) {\n    list-style: none;\n  }\n  :where(:focus-visible)',
			),
	],
	['unlayered rule', (css: string) => `${css}\n.x { color: red; }`],
	[
		'representative recipe class moved to the wrong layer',
		(css: string) => {
			return css.replace(
				'@layer luke-ui.recipes {\n  .recipe-class { display: inline-flex; }\n  .recipe-class > * { margin-block-start: 1px; }\n}',
				'@layer luke-ui.utilities {\n  .recipe-class { display: inline-flex; }\n  .recipe-class > * { margin-block-start: 1px; }\n}',
			);
		},
	],
];

for (const [name, mutate] of stylesheetMutations) {
	test(`rejects a stylesheet with a ${name}`, () => {
		expect(() => {
			return assertStylesheetContract(mutate(validStylesheetFixture), {
				recipeClasses: ['recipe-class'],
				utilityClasses: ['utility-class'],
			});
		}).toThrow(/.+/);
	});
}

test('queries responsive conditions on the logical inline axis', async () => {
	const stylesheet = await readPublicStylesheet();

	expect(stylesheet).toContain('@container (inline-size >=');
	expect(stylesheet).not.toContain('@container (width >=');
});

test('recognises escaped class identifiers', () => {
	expect(() => {
		return assertStylesheetContract(
			validStylesheetFixture.replaceAll('recipe-class', 'recipe\\:class'),
			{
				recipeClasses: ['recipe:class'],
				utilityClasses: ['utility-class'],
			},
		);
	}).not.toThrow();
});

async function readPublicStylesheet(): Promise<string> {
	return readFile(new URL('../../../dist/stylesheet.css', import.meta.url), 'utf8');
}

/** One utilities-layer class from the built stylesheet (package-internal sprinkles). */
function representativeUtilityClasses(stylesheet: string): Array<string> {
	const utilitiesBlock = stylesheet.match(
		/@layer luke-ui\.utilities \{([\s\S]*?)(?=\n@layer |\n@keyframes |$)/,
	)?.[1];
	if (utilitiesBlock == null) throw new Error('Expected an @layer luke-ui.utilities block.');
	const className = utilitiesBlock.match(/^\s*\.([A-Za-z0-9_-]+)\s*\{/m)?.[1];
	if (className == null) throw new Error('Expected a class rule in @layer luke-ui.utilities.');
	return [className];
}

function assertStylesheetContract(
	stylesheet: string,
	{
		analysis: providedAnalysis,
		lineClampClasses,
		recipeClasses,
		textClassesByTypography,
		utilityClasses,
	}: {
		analysis?: StylesheetAnalysis;
		lineClampClasses?: LineClampClasses;
		recipeClasses: Array<string>;
		textClassesByTypography?: TextClassesByTypography;
		utilityClasses: Array<string>;
	},
): void {
	const analysis = providedAnalysis ?? analyzeStylesheet(stylesheet);

	assertLayerOrderStatementFirst(stylesheet);
	assertNoRedundantEmptyLayerStatements(stylesheet);
	assertEffectiveLayerOrder(analysis);
	assertLayerNames(analysis);
	assertNoBaseLayerDeclarations(analysis);
	assertRootNodes(analysis);
	assertNoStableClassSelectors(analysis);
	assertRecipesLayerHasRules(analysis);
	assertGlobalRules(stylesheet);

	for (const className of recipeClasses) {
		assertClassOwnership(analysis, className, 'luke-ui.recipes');
	}
	for (const className of utilityClasses) {
		assertClassOwnership(analysis, className, 'luke-ui.utilities');
	}
	if (textClassesByTypography) assertTextTrimOwnership(analysis, textClassesByTypography);
	if (lineClampClasses) assertLineClampOwnership(analysis, lineClampClasses);
}

function analyzeStylesheet(stylesheet: string): StylesheetAnalysis {
	let rootRules: Array<CssRule> | undefined;

	transform({
		filename: 'stylesheet.css',
		code: Buffer.from(stylesheet),
		visitor: {
			StyleSheetExit(sheet) {
				// Clone instead of returning — Lightning CSS fails to re-serialize some var() ASTs.
				rootRules = structuredClone(sheet).rules as Array<CssRule>;
			},
		},
	});

	if (rootRules == null) throw new Error('Expected Lightning CSS to produce a stylesheet AST.');

	const styleRules: Array<IndexedStyleRule> = [];
	const rulesByClass = new Map<string, Array<IndexedStyleRule>>();
	const layerStack: Array<string | undefined> = [];

	walkRules(rootRules, layerStack, (rule, owningLayer) => {
		const indexed = indexStyleRule(rule, owningLayer);
		styleRules.push(indexed);
		for (const className of indexed.classNames) {
			const existing = rulesByClass.get(className);
			if (existing) existing.push(indexed);
			else rulesByClass.set(className, [indexed]);
		}
	});

	return { rootRules, styleRules, rulesByClass };
}

function walkRules(
	rules: Array<CssRule>,
	layerStack: Array<string | undefined>,
	onStyle: (rule: StyleRule, owningLayer: string | undefined) => void,
): void {
	for (const rule of rules) {
		if (rule.type === 'layer-block') {
			layerStack.push(qualifiedLayerName(layerStack.at(-1), layerBlockName(rule)));
			walkRules((rule.value.rules as Array<CssRule>) ?? [], layerStack, onStyle);
			layerStack.pop();
			continue;
		}

		if (rule.type === 'style') {
			onStyle(rule.value as unknown as StyleRule, layerStack.at(-1));
			const nested = (rule.value.rules as Array<CssRule>) ?? [];
			if (nested.length > 0) walkRules(nested, layerStack, onStyle);
			continue;
		}

		if (rule.type === 'media' || rule.type === 'supports' || rule.type === 'container') {
			const nested = (rule.value.rules as Array<CssRule>) ?? [];
			if (nested.length > 0) walkRules(nested, layerStack, onStyle);
		}
	}
}

function layerBlockName(rule: CssRule): string | undefined {
	const name = rule.value.name;
	if (name == null) return;
	if (Array.isArray(name)) return name.join('.');
	return;
}

/** The full name of `name` declared inside the `parent` layer. */
function qualifiedLayerName(
	parent: string | undefined,
	name: string | undefined,
): string | undefined {
	if (name == null) return;
	return parent == null ? name : `${parent}.${name}`;
}

function indexStyleRule(rule: StyleRule, owningLayer: string | undefined): IndexedStyleRule {
	const classNames = new Set<string>();
	let hasChildUniversal = false;
	const pseudos = new Set<'before' | 'after'>();

	const visitComponents = (
		components: Array<SelectorComponent>,
		insideNot: boolean,
		onAttribute: (name: string, insideNot: boolean) => void,
	): void => {
		for (let index = 0; index < components.length; index++) {
			const component = components[index];
			if (component == null) continue;

			if (component.type === 'class' && component.name != null) {
				classNames.add(component.name);
			}

			if (component.type === 'attribute' && component.name != null) {
				onAttribute(component.name, insideNot);
			}

			if (
				component.type === 'pseudo-element' &&
				(component.kind === 'before' || component.kind === 'after')
			) {
				pseudos.add(component.kind);
			}

			if (
				component.type === 'combinator' &&
				component.value === 'child' &&
				components[index + 1]?.type === 'universal'
			) {
				hasChildUniversal = true;
			}

			if (component.type === 'pseudo-class' && component.kind === 'not' && component.selectors) {
				for (const nested of component.selectors) {
					visitComponents(nested, true, onAttribute);
				}
			}
		}
	};

	const positiveAttributes = new Set<string>();
	const mentionedAttributes = new Set<string>();
	for (const selector of rule.selectors) {
		visitComponents(selector, false, (name, insideNot) => {
			mentionedAttributes.add(name);
			if (!insideNot) positiveAttributes.add(name);
		});
	}

	const declarations = rule.declarations?.declarations ?? [];
	const importantDeclarations = rule.declarations?.importantDeclarations ?? [];

	return {
		rule,
		owningLayer,
		classNames,
		hasAttribute: (attribute) => positiveAttributes.has(attribute),
		mentionsAttribute: (attribute) => mentionedAttributes.has(attribute),
		hasChildUniversal,
		hasPseudo: (pseudo) => pseudos.has(pseudo),
		hasDeclarations: declarations.length > 0 || importantDeclarations.length > 0,
	};
}

function assertPrivateStylesheetSentinel(analysis: StylesheetAnalysis): void {
	const rules = analysis.styleRules.filter((rule) => rule.hasAttribute('data-skeleton-inline'));
	expect(rules.length).toBeGreaterThan(0);
	for (const rule of rules) expect(rule.owningLayer).toBe('luke-ui.recipes');
	expect(
		rules.some((rule) =>
			declarationListHas(rule, 'background-color', 'var(--luke-color-loading-skeleton)', true),
		),
	).toBe(true);

	const maskRules = analysis.styleRules.filter((rule) => {
		if (!rule.mentionsAttribute('data-skeleton-inline')) return false;
		if (!rule.hasChildUniversal) return false;
		return declarationListHas(rule, 'background-color', 'var(--luke-color-loading-skeleton)', true);
	});
	expect(maskRules.length).toBeGreaterThan(0);
	for (const rule of maskRules) expect(rule.owningLayer).toBe('luke-ui.recipes');
}

function assertLayerOrderStatementFirst(stylesheet: string): void {
	if (!stylesheet.startsWith(`${cascadeLayerOrder}\n`)) {
		throw new Error('Expected the stylesheet to start with the cascade layer order statement.');
	}
}

/** Layers by full name, in the order the stylesheet first creates them. */
function effectiveLayerOrder(rules: Array<CssRule>, parent?: string): Array<string> {
	const order: Array<string> = [];
	for (const rule of rules) {
		const names =
			rule.type === 'layer-statement'
				? layerStatementNames(rule)
				: rule.type === 'layer-block'
					? [layerBlockName(rule) ?? '']
					: [];
		for (const name of names) {
			const fullName = qualifiedLayerName(parent, name) ?? '';
			if (!order.includes(fullName)) order.push(fullName);
		}
		const nested = (rule.value.rules as Array<CssRule> | undefined) ?? [];
		const nestedParent =
			rule.type === 'layer-block' ? qualifiedLayerName(parent, layerBlockName(rule)) : parent;
		for (const fullName of effectiveLayerOrder(nested, nestedParent)) {
			if (!order.includes(fullName)) order.push(fullName);
		}
	}
	return order;
}

/**
 * The order statement alone creates every layer in precedence order, so nothing after it can
 * create a layer early or out of order.
 */
function assertEffectiveLayerOrder(analysis: StylesheetAnalysis): void {
	expect(effectiveLayerOrder(analysis.rootRules.slice(0, 2))).toEqual(layerOrder);
	expect(effectiveLayerOrder(analysis.rootRules)).toEqual(layerOrder);
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

/** The reset layer holds exactly the global rules, in one block. */
function assertGlobalRules(stylesheet: string): void {
	const blocks = [...stylesheet.matchAll(new RegExp(RESET_LAYER_BLOCK_PATTERN, 'gm'))];
	expect(blocks).toHaveLength(1);
	expect(blocks[0]?.[1]).toBe(globalRules);
}

function assertLayerNames(analysis: StylesheetAnalysis): void {
	const visit = (rules: Array<CssRule>, parent: string | undefined): void => {
		for (const rule of rules) {
			if (rule.type === 'layer-statement') {
				const names = layerStatementNames(rule);
				if (names.length === 0) throw new Error('Anonymous cascade layers are not allowed.');
				for (const name of names) assertKnownLayer(qualifiedLayerName(parent, name));
				continue;
			}

			if (rule.type === 'layer-block') {
				const name = qualifiedLayerName(parent, layerBlockName(rule));
				if (name == null || name === '') {
					throw new Error('Anonymous cascade layers are not allowed.');
				}
				assertKnownLayer(name);
				visit((rule.value.rules as Array<CssRule>) ?? [], name);
				continue;
			}

			if (
				rule.type === 'media' ||
				rule.type === 'supports' ||
				rule.type === 'container' ||
				rule.type === 'style'
			) {
				const nested = (rule.value.rules as Array<CssRule>) ?? [];
				if (nested.length > 0) visit(nested, parent);
			}
		}
	};

	visit(analysis.rootRules, undefined);
}

function assertKnownLayer(name: string | undefined): void {
	if (name != null && layerNameSet.has(name)) return;
	throw new Error(`Unexpected cascade layer: ${name}`);
}

function layerStatementNames(rule: CssRule): Array<string> {
	const names = rule.value.names as Array<Array<string>> | undefined;
	if (names == null) return [];
	return names.map((parts) => parts.join('.'));
}

/**
 * The `base` layer is reserved for a consuming application's own element defaults. Luke UI
 * declares it so its rank is fixed, but must never emit declarations into it.
 */
function assertNoBaseLayerDeclarations(analysis: StylesheetAnalysis): void {
	const offenders = new Set<string>();
	for (const rule of analysis.styleRules) {
		if (rule.owningLayer !== 'base') continue;
		offenders.add(formatPrimarySelector(rule));
	}

	if (offenders.size > 0) {
		throw new Error(
			`Luke UI must not emit declarations into @layer base: ${[...offenders].join(', ')}`,
		);
	}
}

function assertRootNodes(analysis: StylesheetAnalysis): void {
	for (const rule of analysis.rootRules) {
		if (
			rule.type === 'layer-statement' ||
			rule.type === 'layer-block' ||
			rule.type === 'property' ||
			rule.type === 'keyframes'
		) {
			continue;
		}

		if (rule.type === 'style') {
			throw new Error('Root qualified rules are not allowed.');
		}

		throw new Error(
			`Unexpected root at-rule: @${rule.type === 'unknown' ? (rule.value.name as string) : rule.type}`,
		);
	}
}

function assertRecipesLayerHasRules(analysis: StylesheetAnalysis): void {
	const hasRecipeRule = analysis.styleRules.some(
		(rule) => rule.owningLayer === 'luke-ui.recipes' && rule.hasDeclarations,
	);
	if (!hasRecipeRule) throw new Error('Expected the recipes layer to contain a rule.');
}

/** No root or reset class: the stylesheet styles the document, not an opt-in element. */
function assertNoStableClassSelectors(analysis: StylesheetAnalysis): void {
	const selectors = new Set<string>();
	for (const rule of analysis.styleRules) {
		for (const className of rule.classNames) {
			if (className.startsWith('luke-ui-')) selectors.add(`.${className}`);
		}
	}

	expect(selectors).toEqual(new Set());
}

function assertClassOwnership(
	analysis: StylesheetAnalysis,
	className: string,
	layerName: string,
): void {
	const rules = getRulesForClass(analysis, className);
	expect(rules.length).toBeGreaterThan(0);
	for (const rule of rules) expect(rule.owningLayer).toBe(layerName);
	expect(rules.some((rule) => rule.hasDeclarations)).toBe(true);
}

function assertTextTrimOwnership(
	analysis: StylesheetAnalysis,
	textClassesByTypography: TextClassesByTypography,
): void {
	for (const typography of typeStyles) {
		const rules = textClassesByTypography[typography].flatMap((className) =>
			getRulesForClass(analysis, className),
		);
		assertPseudoDeclaration(
			rules,
			'before',
			'margin-block-end',
			`var(${capsizeTrimVarName(typography, 'capHeightTrim')})`,
		);
		assertPseudoDeclaration(
			rules,
			'after',
			'margin-block-start',
			`var(${capsizeTrimVarName(typography, 'baselineTrim')})`,
		);
	}
}

function assertLineClampOwnership(
	analysis: StylesheetAnalysis,
	{ numeric, singleLine }: LineClampClasses,
): void {
	const singleLineRules = singleLine.flatMap((className) => getRulesForClass(analysis, className));
	assertDeclaration(singleLineRules, 'display', 'block');
	assertDeclaration(singleLineRules, 'text-overflow', 'ellipsis');
	assertDeclaration(singleLineRules, 'white-space', 'nowrap');

	for (const lineClamp of numericLineClampVariants) {
		const rules = numeric[lineClamp].flatMap((className) => getRulesForClass(analysis, className));
		assertDeclaration(rules, 'display', '-webkit-box');
		assertDeclaration(rules, '-webkit-box-orient', 'vertical');
		assertDeclaration(rules, '-webkit-line-clamp', String(lineClamp));
		assertDeclaration(rules, 'line-clamp', String(lineClamp));
	}
}

function assertDeclaration(rules: Array<IndexedStyleRule>, property: string, value: string): void {
	const matchingRules = rules.filter((rule) => declarationListHas(rule, property, value));
	expect(matchingRules.length).toBeGreaterThan(0);
	for (const rule of matchingRules) expect(rule.owningLayer).toBe('luke-ui.recipes');
}

function assertPseudoDeclaration(
	rules: Array<IndexedStyleRule>,
	pseudo: 'before' | 'after',
	property: string,
	value: string,
): void {
	const matchingRules = rules.filter(
		(rule) => rule.hasPseudo(pseudo) && declarationListHas(rule, property, value),
	);
	expect(matchingRules.length).toBeGreaterThan(0);
	for (const rule of matchingRules) expect(rule.owningLayer).toBe('luke-ui.recipes');
}

function getRulesForClass(
	analysis: StylesheetAnalysis,
	className: string,
): Array<IndexedStyleRule> {
	return analysis.rulesByClass.get(className) ?? [];
}

function declarationListHas(
	rule: IndexedStyleRule,
	property: string,
	value: string,
	important?: boolean,
): boolean {
	const lists =
		important === true
			? [rule.rule.declarations.importantDeclarations]
			: important === false
				? [rule.rule.declarations.declarations]
				: [rule.rule.declarations.declarations, rule.rule.declarations.importantDeclarations];

	return lists.some((list) =>
		list.some((declaration) => matchesDeclaration(declaration, property, value)),
	);
}

function matchesDeclaration(declaration: Declaration, property: string, value: string): boolean {
	if (property === 'box-sizing' && value === 'border-box') {
		return declaration.property === 'box-sizing' && declaration.value === 'border-box';
	}

	if (property === 'text-overflow' && value === 'ellipsis') {
		return declaration.property === 'text-overflow' && declaration.value === 'ellipsis';
	}

	if (property === 'white-space' && value === 'nowrap') {
		return declaration.property === 'white-space' && declaration.value === 'nowrap';
	}

	if (property === '-webkit-box-orient' && value === 'vertical') {
		return (
			declaration.property === 'box-orient' &&
			Array.isArray(declaration.vendorPrefix) &&
			declaration.vendorPrefix.includes('webkit') &&
			declaration.value === 'vertical'
		);
	}

	if (property === 'display') {
		return matchesDisplay(declaration, value);
	}

	if (property === '-webkit-line-clamp' || property === 'line-clamp') {
		return matchesLineClamp(declaration, property, value);
	}

	if (value.startsWith('var(')) {
		return matchesVarDeclaration(declaration, property, value);
	}

	return false;
}

function matchesDisplay(declaration: Declaration, value: string): boolean {
	if (declaration.property !== 'display') return false;
	const display = declaration.value as {
		type?: string;
		outside?: string;
		inside?: { type?: string; vendorPrefix?: Array<string> };
	};
	if (display?.type !== 'pair') return false;

	if (value === 'block') {
		return display.outside === 'block' && display.inside?.type === 'flow';
	}
	if (value === 'grid') {
		return display.outside === 'block' && display.inside?.type === 'grid';
	}
	if (value === '-webkit-box') {
		return (
			display.outside === 'block' &&
			display.inside?.type === 'box' &&
			Array.isArray(display.inside.vendorPrefix) &&
			display.inside.vendorPrefix.includes('webkit')
		);
	}
	if (value === 'inline-flex') {
		return (
			display.outside === 'inline' &&
			display.inside?.type === 'flex' &&
			Array.isArray(display.inside.vendorPrefix)
		);
	}
	return false;
}

function matchesLineClamp(declaration: Declaration, property: string, value: string): boolean {
	if (declaration.property !== 'custom') return false;
	const custom = declaration.value as {
		name?: string;
		value?: Array<{ type?: string; value?: { type?: string; value?: number } }>;
	};
	if (custom.name !== property) return false;
	const token = custom.value?.[0];
	return (
		token?.type === 'token' && token.value?.type === 'number' && String(token.value.value) === value
	);
}

function matchesVarDeclaration(declaration: Declaration, property: string, value: string): boolean {
	const ident = value.match(/^var\((--[^)]+)\)$/)?.[1];
	if (ident == null) return false;

	if (declaration.property === 'unparsed') {
		const unparsed = declaration.value as {
			propertyId?: { property?: string };
			value?: Array<{ type?: string; value?: { name?: { ident?: string } } }>;
		};
		if (unparsed.propertyId?.property !== property) return false;
		const first = unparsed.value?.[0];
		return first?.type === 'var' && first.value?.name?.ident === ident;
	}

	return false;
}

function formatPrimarySelector(rule: IndexedStyleRule): string {
	const first = rule.rule.selectors[0] ?? [];
	return first
		.map((component) => {
			if (component.type === 'class') return `.${component.name}`;
			if (component.type === 'attribute') return `[${component.name}]`;
			if (component.type === 'universal') return '*';
			if (component.type === 'combinator' && component.value === 'child') return '>';
			if (component.type === 'pseudo-element') return `::${component.kind}`;
			return component.type;
		})
		.join(' ');
}

const validStylesheetFixture = `${cascadeLayerOrder}
@layer luke-ui.reset {
${globalRules}
}
@layer luke-ui.recipes {
  .recipe-class { display: inline-flex; }
  .recipe-class > * { margin-block-start: 1px; }
}
@layer luke-ui.utilities {
  .utility-class { display: grid; }
}
@keyframes generated-animation {
  from { opacity: 0; }
  to { opacity: 1; }
}`;

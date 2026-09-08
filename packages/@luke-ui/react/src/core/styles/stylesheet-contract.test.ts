import { existsSync } from 'node:fs';
import { transform } from 'lightningcss';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';
import type { TypeStyle } from '../../theme/contract.js';
import { typeStyles } from '../../theme/contract.js';

const lukeOwnedLayerNames = [
	'reset',
	'theme',
	'base',
	'recipes',
	'structural',
	'utilities',
] as const;
const lukeOwnedLayerNameSet = new Set<string>(lukeOwnedLayerNames);
const AUTHORITATIVE_LAYER_ORDER_PATTERN =
	/^@layer reset, theme, base, recipes, structural, utilities;/m;
const AUTHORITATIVE_LAYER_ORDER_LINE_PATTERN =
	/^@layer reset, theme, base, recipes, structural, utilities;\n/m;
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

test('builds the public stylesheet with the retained layer contract', async () => {
	const stylesheet = await readPublicStylesheet();
	const icon = await import('@luke-ui/react/icon');
	const text = await import('@luke-ui/react/text');
	const styles = await import('@luke-ui/react/styles');
	const recipeClasses = [...icon.iconRecipe({ size: 'medium' }).split(' ')];
	const textClassesByTypography = Object.fromEntries(
		typeStyles.map((typography) => [typography, text.textRecipe({ typography }).split(' ')]),
	) as TextClassesByTypography;
	const utilityClasses = styles.createSprinkles({ display: 'grid' }).className?.split(' ') ?? [];
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
	['missing stable selector', (css: string) => css.replace('.luke-ui-theme', '.theme-root')],
	['extra stable selector', (css: string) => `${css}\n@layer theme { .luke-ui-extra {} }`],
	[
		'reordered authoritative layer declarations',
		(css: string) => {
			return css.replace(
				AUTHORITATIVE_LAYER_ORDER_PATTERN,
				'@layer theme, reset, base, recipes, structural, utilities;',
			);
		},
	],
	[
		'early individual layer declarations before authoritative order',
		(css: string) => {
			return css.replace(
				AUTHORITATIVE_LAYER_ORDER_LINE_PATTERN,
				'@layer reset;\n@layer theme;\n@layer base;\n@layer recipes;\n@layer structural;\n@layer utilities;\n@layer reset, theme, base, recipes, structural, utilities;\n',
			);
		},
	],
	[
		'early layer block before authoritative order',
		(css: string) => {
			return css.replace(
				AUTHORITATIVE_LAYER_ORDER_LINE_PATTERN,
				'@layer recipes { .early {} }\n@layer reset, theme, base, recipes, structural, utilities;\n',
			);
		},
	],
	['anonymous layer statement', (css: string) => `${css}\n@layer;`],
	['anonymous layer block', (css: string) => `${css}\n@layer { .anonymous {} }`],
	['unknown layer', (css: string) => `${css}\n@layer components;`],
	['nested layer', (css: string) => `${css}\n@layer recipes { @layer utilities {} }`],
	['root qualified rule', (css: string) => `${css}\n.root-rule { color: red; }`],
	['base layer rule', (css: string) => `${css}\n@layer base { .consumer-default { color: red; } }`],
	['lookalike layer at-rule', (css: string) => `${css}\n@layered {}`],
	[
		'representative recipe class moved to the wrong layer',
		(css: string) => {
			return css.replace(
				'@layer recipes {\n  .recipe-class { display: inline-flex; }\n}',
				'@layer utilities {\n  .recipe-class { display: inline-flex; }\n}',
			);
		},
	],
	[
		'representative utility class moved to the wrong layer',
		(css: string) => {
			return css.replace(
				'@layer utilities {\n  .utility-class { display: grid; }\n}',
				'@layer recipes {\n  .utility-class { display: grid; }\n}',
			);
		},
	],
	[
		'representative retained-layer content removed',
		(css: string) => css.replace('  .recipe-class { display: inline-flex; }\n', ''),
	],
	[
		'class-like text in an attribute value',
		(css: string) => {
			return css.replace(
				'.recipe-class { display: inline-flex; }',
				'[data-class=".recipe-class"] { display: inline-flex; }',
			);
		},
	],
	[
		'redundant empty layer statements after authoritative order',
		(css: string) => css.replace(AUTHORITATIVE_LAYER_ORDER_LINE_PATTERN, '$&@layer recipes;\n'),
	],
	[
		'empty transitional recipes layer',
		(css: string) =>
			css.replace(
				'@layer recipes {\n  .recipe-class { display: inline-flex; }\n}',
				'@layer recipes {}',
			),
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

test('ships every style rule in one stylesheet', () => {
	const dist = (file: string) => new URL(`../../../dist/${file}`, import.meta.url);

	expect(existsSync(dist('stylesheet.css'))).toBe(true);
	expect(existsSync(dist('stylesheet2.css'))).toBe(false);
});

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

	assertEffectiveLayerCreationOrder(analysis);
	assertNoRedundantEmptyLayerStatements(stylesheet);
	assertAuthoritativeLayerOrder(getAuthoritativeLayerOrder(analysis));
	assertLayerNames(analysis);
	assertNoBaseLayerDeclarations(analysis);
	assertRootNodes(analysis);
	assertStableSelectors(analysis);
	assertRecipesLayerHasRules(analysis);
	assertSentinel(analysis, 'luke-ui-reset', 'reset', 'box-sizing', 'border-box');
	assertSentinel(analysis, 'luke-ui-theme', 'theme', 'color', 'var(--luke-color-text-primary)');
	assertSentinel(
		analysis,
		'luke-ui-theme',
		'theme',
		'font-family',
		'var(--luke-font-body-font-family)',
	);
	assertSentinel(
		analysis,
		'luke-ui-theme',
		'theme',
		'font-size',
		'var(--luke-font-body-font-size)',
	);

	for (const className of recipeClasses) assertClassOwnership(analysis, className, 'recipes');
	for (const className of utilityClasses) assertClassOwnership(analysis, className, 'utilities');
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
			const name = layerBlockName(rule);
			layerStack.push(name);
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
	if (name == null) return undefined;
	if (Array.isArray(name)) return name.join('.');
	return undefined;
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
	for (const rule of rules) expect(rule.owningLayer).toBe('recipes');
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
	for (const rule of maskRules) expect(rule.owningLayer).toBe('structural');
}

function getAuthoritativeLayerOrder(analysis: StylesheetAnalysis): Array<string> {
	for (const rule of analysis.rootRules) {
		if (rule.type !== 'layer-statement') continue;
		const names = layerStatementNames(rule);
		if (names.length < 2) continue;
		return names;
	}

	throw new Error('Expected an authoritative combined cascade-layer order statement.');
}

function assertEffectiveLayerCreationOrder(analysis: StylesheetAnalysis): void {
	let sawAuthoritativeOrder = false;

	for (const rule of analysis.rootRules) {
		if (rule.type !== 'layer-statement' && rule.type !== 'layer-block') continue;

		const isCombinedOrder = rule.type === 'layer-statement' && layerStatementNames(rule).length > 1;

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
			const label =
				rule.type === 'layer-statement'
					? layerStatementNames(rule).join(', ')
					: (layerBlockName(rule) ?? '');
			throw new Error(
				`Layer "${label}" was created before the authoritative combined cascade-layer order statement.`,
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
	expect(order).toEqual([...lukeOwnedLayerNames]);
}

function assertLayerNames(analysis: StylesheetAnalysis): void {
	const visit = (rules: Array<CssRule>, depth: number): void => {
		for (const rule of rules) {
			if (rule.type === 'layer-statement') {
				const names = layerStatementNames(rule);
				if (names.length === 0) throw new Error('Anonymous cascade layers are not allowed.');
				for (const name of names) {
					if (lukeOwnedLayerNameSet.has(name)) continue;
					throw new Error(`Unexpected cascade layer: ${name}`);
				}
				continue;
			}

			if (rule.type === 'layer-block') {
				if (depth > 0) throw new Error('Nested cascade layers are not allowed.');
				const name = layerBlockName(rule);
				if (name == null || name === '') {
					throw new Error('Anonymous cascade layers are not allowed.');
				}
				if (!lukeOwnedLayerNameSet.has(name)) {
					throw new Error(`Unexpected cascade layer: ${name}`);
				}
				visit((rule.value.rules as Array<CssRule>) ?? [], depth + 1);
				continue;
			}

			if (
				rule.type === 'media' ||
				rule.type === 'supports' ||
				rule.type === 'container' ||
				rule.type === 'style'
			) {
				const nested = (rule.value.rules as Array<CssRule>) ?? [];
				if (nested.length > 0) visit(nested, depth);
			}
		}
	};

	visit(analysis.rootRules, 0);
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
		(rule) => rule.owningLayer === 'recipes' && rule.hasDeclarations,
	);
	if (!hasRecipeRule) throw new Error('Expected the transitional recipes layer to contain a rule.');
}

function assertStableSelectors(analysis: StylesheetAnalysis): void {
	const selectors = new Set<string>();
	for (const rule of analysis.styleRules) {
		for (const className of rule.classNames) {
			if (className.startsWith('luke-ui-')) selectors.add(`.${className}`);
		}
	}

	expect(selectors).toEqual(new Set(['.luke-ui-reset', '.luke-ui-theme']));
}

function assertSentinel(
	analysis: StylesheetAnalysis,
	className: string,
	layerName: string,
	property: string,
	value: string,
): void {
	const rules = getRulesForClass(analysis, className);
	expect(rules.length).toBeGreaterThan(0);
	for (const rule of rules) expect(rule.owningLayer).toBe(layerName);
	expect(rules.some((rule) => declarationListHas(rule, property, value))).toBe(true);
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
			`var(--luke-font-${typography}-cap-height-trim)`,
		);
		assertPseudoDeclaration(
			rules,
			'after',
			'margin-block-start',
			`var(--luke-font-${typography}-baseline-trim)`,
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
	for (const rule of matchingRules) expect(rule.owningLayer).toBe('recipes');
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
	for (const rule of matchingRules) expect(rule.owningLayer).toBe('recipes');
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

const validStylesheetFixture = `@layer reset, theme, base, recipes, structural, utilities;
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
  .recipe-class { display: inline-flex; }
}
@layer structural {
  .structural-class { margin-block-start: 1px; }
}
@layer utilities {
  .utility-class { display: grid; }
}
@keyframes generated-animation {
  from { opacity: 0; }
  to { opacity: 1; }
}`;

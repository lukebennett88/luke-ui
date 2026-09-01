import { readFile } from 'node:fs/promises';
import type { AtRule, Root, Rule } from 'postcss';
import { parse } from 'postcss';
import selectorParser from 'postcss-selector-parser';
import { expect, test } from 'vite-plus/test';
import type { TypeStyle } from '../../theme/contract.js';
import { typeStyles } from '../../theme/contract.js';

const lukeOwnedLayerNames = ['reset', 'theme', 'recipes', 'structural', 'utilities'] as const;
const lukeOwnedLayerNameSet = new Set<string>(lukeOwnedLayerNames);
const stylexPriorityLayerPattern = /^luke\.sx\.priority\d+$/;
type TextClassesByTypography = Record<TypeStyle, Array<string>>;
const numericLineClampVariants = [2, 3, 4, 5] as const;
type NumericLineClampVariant = (typeof numericLineClampVariants)[number];
type LineClampClasses = {
	singleLine: Array<string>;
	numeric: Record<NumericLineClampVariant, Array<string>>;
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
		const root = parse(stylesheet);
		assertPrivateStylesheetSentinel(root);
		return assertStylesheetContract(stylesheet, {
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
				/^@layer reset, theme, luke\.sx\.priority\d+(?:, luke\.sx\.priority\d+)*, recipes, structural, utilities;/m,
				'@layer theme, reset, luke.sx.priority1, recipes, structural, utilities;',
			);
		},
	],
	[
		'early individual layer declarations before authoritative order',
		(css: string) => {
			return css.replace(
				/^@layer reset, theme, luke\.sx\.priority\d+(?:, luke\.sx\.priority\d+)*, recipes, structural, utilities;\n/m,
				'@layer reset;\n@layer theme;\n@layer recipes;\n@layer structural;\n@layer utilities;\n@layer reset, theme, luke.sx.priority1, recipes, structural, utilities;\n',
			);
		},
	],
	[
		'early layer block before authoritative order',
		(css: string) => {
			return css.replace(
				/^@layer reset, theme, luke\.sx\.priority\d+(?:, luke\.sx\.priority\d+)*, recipes, structural, utilities;\n/m,
				'@layer recipes { .early {} }\n@layer reset, theme, luke.sx.priority1, recipes, structural, utilities;\n',
			);
		},
	],
	['anonymous layer statement', (css: string) => `${css}\n@layer;`],
	['anonymous layer block', (css: string) => `${css}\n@layer { .anonymous {} }`],
	['unknown layer', (css: string) => `${css}\n@layer components;`],
	['nested layer', (css: string) => `${css}\n@layer recipes { @layer utilities {} }`],
	['root qualified rule', (css: string) => `${css}\n.root-rule { color: red; }`],
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
		(css: string) => {
			return css.replace(
				/^(@layer reset, theme, luke\.sx\.priority\d+(?:, luke\.sx\.priority\d+)*, recipes, structural, utilities;\n)/m,
				'$1@layer recipes;\n',
			);
		},
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
	assertRecipesLayerHasRules(root);
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

	for (const className of recipeClasses) assertClassOwnership(root, className, 'recipes');
	for (const className of utilityClasses) assertClassOwnership(root, className, 'utilities');
	if (textClassesByTypography) assertTextTrimOwnership(root, textClassesByTypography);
	if (lineClampClasses) assertLineClampOwnership(root, lineClampClasses);
}

function assertPrivateStylesheetSentinel(root: Root): void {
	const rules = collectSkeletonInlineRules(root);
	expect(rules.length).toBeGreaterThan(0);
	for (const rule of rules) expect(getOwningLayer(rule)).toBe('recipes');
	expect(
		rules.some((rule) => {
			return rule.nodes.some(
				(node) =>
					node.type === 'decl' &&
					node.prop === 'background-color' &&
					node.value === 'var(--luke-color-loading-skeleton)' &&
					node.important,
			);
		}),
	).toBe(true);

	const maskRules = collectSkeletonDescendantMaskRules(root);
	expect(maskRules.length).toBeGreaterThan(0);
	for (const rule of maskRules) expect(getOwningLayer(rule)).toBe('structural');
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

	const priorityLayers = order.slice(2).filter((name) => stylexPriorityLayerPattern.test(name));
	expect(priorityLayers.length).toBeGreaterThan(0);
	expect(priorityLayers.every((name, index) => name === `luke.sx.priority${index + 1}`)).toBe(true);

	expect(order.slice(2 + priorityLayers.length)).toEqual(['recipes', 'structural', 'utilities']);
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
			if (lukeOwnedLayerNameSet.has(name) || stylexPriorityLayerPattern.test(name)) continue;
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
		if (node.type === 'rule') throw node.error('Root qualified rules are not allowed.');
		if (node.type !== 'atrule') throw node.error('Unexpected root stylesheet node.');
		if (node.name === 'layer') continue;
		if (node.name === 'property') continue;
		if (node.name === 'keyframes' && node.nodes) continue;

		throw node.error(`Unexpected root at-rule: @${node.name}`);
	}
}

function assertRecipesLayerHasRules(root: Root): void {
	let hasRecipeRule = false;
	root.walkRules((rule) => {
		if (getOwningLayer(rule) === 'recipes' && rule.nodes.some((node) => node.type === 'decl')) {
			hasRecipeRule = true;
		}
	});
	if (!hasRecipeRule) throw new Error('Expected the transitional recipes layer to contain a rule.');
}

function assertStableSelectors(root: Root): void {
	const selectors = new Set<string>();
	root.walkRules((rule) => {
		for (const className of getClassNames(rule)) {
			if (className.startsWith('luke-ui-')) selectors.add(`.${className}`);
		}
	});

	expect(selectors).toEqual(new Set(['.luke-ui-reset', '.luke-ui-theme']));
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

function assertClassOwnership(root: Root, className: string, layerName: string): void {
	const rules = getRulesForClass(root, className);
	expect(rules.length).toBeGreaterThan(0);
	for (const rule of rules) expect(getOwningLayer(rule)).toBe(layerName);
	expect(rules.some((rule) => rule.nodes.some((node) => node.type === 'decl'))).toBe(true);
}

/**
 * Text is StyleX-migrated (#551): its trim and line-clamp classes live in a `luke.sx.priorityN`
 * layer, not the transitional `recipes` layer that still holds other components' Vanilla Extract
 * output. `assertTextTrimOwnership` and `assertLineClampOwnership` below assert that StyleX
 * ownership directly, instead of reusing `assertClassOwnership`'s single fixed `recipes` layer.
 * StyleX also resolves the logical `marginBlockEnd`/`marginBlockStart` properties Text's recipe
 * authors to their physical `margin-bottom`/`margin-top` equivalents at compile time (block-axis
 * margins do not flip under RTL, so this is a safe, direction-agnostic rewrite), which is why the
 * expected property names below differ from the logical properties `text/recipe.ts` writes.
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
		expect(layer !== undefined && stylexPriorityLayerPattern.test(layer)).toBe(true);
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
		expect(layer !== undefined && stylexPriorityLayerPattern.test(layer)).toBe(true);
	}
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

const validStylesheetFixture = `@layer reset, theme, luke.sx.priority1, recipes, structural, utilities;
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
@layer luke.sx.priority1 {
  .stylex-class { outline-color: transparent; }
}
@keyframes generated-animation {
  from { opacity: 0; }
  to { opacity: 1; }
}`;

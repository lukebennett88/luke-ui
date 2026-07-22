import { readFile } from 'node:fs/promises';
import { parse } from 'postcss';
import type { AtRule, Root, Rule } from 'postcss';
import selectorParser from 'postcss-selector-parser';
import { expect, test } from 'vite-plus/test';
import { fontSizeSteps } from '../theme/contract.js';
import type { FontSizeStep } from '../theme/contract.js';

const retainedLayerNames = ['reset', 'theme', 'recipes', 'utilities'] as const;
const retainedLayerNameSet = new Set<string>(retainedLayerNames);
type TextClassesBySize = Record<FontSizeStep, Array<string>>;
const numericLineClampVariants = [2, 3, 4, 5] as const;
type NumericLineClampVariant = (typeof numericLineClampVariants)[number];
type LineClampClasses = {
	singleLine: Array<string>;
	numeric: Record<NumericLineClampVariant, Array<string>>;
};

test('builds the public stylesheet with the retained layer contract', async () => {
	const stylesheet = await readFile(new URL('../../dist/stylesheet.css', import.meta.url), 'utf8');
	const recipes = await import('@luke-ui/react/recipes');
	const styles = await import('@luke-ui/react/styles');
	const recipeClasses = recipes.icon().split(' ');
	const textClassesBySize = Object.fromEntries(
		fontSizeSteps.map((size) => [size, recipes.text({ size }).split(' ')]),
	) as TextClassesBySize;
	const utilityClasses = styles.createSprinkles({ display: 'grid' }).className?.split(' ') ?? [];
	const lineClampClasses: LineClampClasses = {
		numeric: Object.fromEntries(
			numericLineClampVariants.map((lineClamp) => [
				lineClamp,
				recipes.text({ lineClamp }).split(' '),
			]),
		) as Record<NumericLineClampVariant, Array<string>>,
		singleLine: recipes.text({ lineClamp: true }).split(' '),
	};

	expect(() =>
		assertStylesheetContract(stylesheet, {
			lineClampClasses,
			recipeClasses,
			textClassesBySize,
			utilityClasses,
		}),
	).not.toThrow();
});

test.each([
	['missing stable selector', (css: string) => css.replace('.luke-ui-theme', '.theme-root')],
	['extra stable selector', (css: string) => `${css}\n@layer theme { .luke-ui-extra {} }`],
	[
		'reordered initial layer declarations',
		(css: string) => css.replace('@layer reset;\n@layer theme;', '@layer theme;\n@layer reset;'),
	],
	['anonymous layer statement', (css: string) => `${css}\n@layer;`],
	['anonymous layer block', (css: string) => `${css}\n@layer { .anonymous {} }`],
	['unknown layer', (css: string) => `${css}\n@layer components;`],
	['nested layer', (css: string) => `${css}\n@layer recipes { @layer utilities {} }`],
	['root qualified rule', (css: string) => `${css}\n.root-rule { color: red; }`],
	['lookalike layer at-rule', (css: string) => `${css}\n@layered {}`],
	[
		'representative recipe class moved to the wrong layer',
		(css: string) =>
			css.replace(
				'@layer recipes {\n  .recipe-class { display: inline-flex; }\n}',
				'@layer utilities {\n  .recipe-class { display: inline-flex; }\n}',
			),
	],
	[
		'representative utility class moved to the wrong layer',
		(css: string) =>
			css.replace(
				'@layer utilities {\n  .utility-class { display: grid; }\n}',
				'@layer recipes {\n  .utility-class { display: grid; }\n}',
			),
	],
	[
		'representative retained-layer content removed',
		(css: string) => css.replace('  .recipe-class { display: inline-flex; }\n', ''),
	],
	[
		'class-like text in an attribute value',
		(css: string) =>
			css.replace(
				'.recipe-class { display: inline-flex; }',
				'[data-class=".recipe-class"] { display: inline-flex; }',
			),
	],
])('rejects a stylesheet with a %s', (_name, mutate) => {
	expect(() =>
		assertStylesheetContract(mutate(validStylesheetFixture), {
			recipeClasses: ['recipe-class'],
			utilityClasses: ['utility-class'],
		}),
	).toThrow(/.+/);
});

test('recognises escaped class identifiers', () => {
	expect(() =>
		assertStylesheetContract(validStylesheetFixture.replaceAll('recipe-class', 'recipe\\:class'), {
			recipeClasses: ['recipe:class'],
			utilityClasses: ['utility-class'],
		}),
	).not.toThrow();
});

function assertStylesheetContract(
	stylesheet: string,
	{
		lineClampClasses,
		recipeClasses,
		textClassesBySize,
		utilityClasses,
	}: {
		lineClampClasses?: LineClampClasses;
		recipeClasses: Array<string>;
		textClassesBySize?: TextClassesBySize;
		utilityClasses: Array<string>;
	},
): void {
	const root = parse(stylesheet);

	expect(getInitialLayerOrder(root)).toEqual(retainedLayerNames);
	assertLayerNames(root);
	assertRootNodes(root);
	assertStableSelectors(root);
	assertSentinel(root, 'luke-ui-reset', 'reset', 'box-sizing', 'border-box');
	assertSentinel(root, 'luke-ui-theme', 'theme', 'color', 'var(--luke-color-text-primary)');
	assertSentinel(root, 'luke-ui-theme', 'theme', 'font-family', 'var(--luke-font-family)');

	for (const className of recipeClasses) assertClassOwnership(root, className, 'recipes');
	for (const className of utilityClasses) assertClassOwnership(root, className, 'utilities');
	if (textClassesBySize) assertTextTrimOwnership(root, textClassesBySize);
	if (lineClampClasses) assertLineClampOwnership(root, lineClampClasses);
}

function getInitialLayerOrder(root: Root): Array<string> {
	return root.nodes.slice(0, retainedLayerNames.length).map((node) => {
		if (node.type !== 'atrule' || node.name !== 'layer' || node.nodes) {
			throw new Error('Expected the stylesheet to begin with layer statements.');
		}

		return node.params.trim();
	});
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
			if (!retainedLayerNameSet.has(name)) throw atRule.error(`Unexpected cascade layer: ${name}`);
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
		if (node.name === 'keyframes' && node.nodes) continue;

		throw node.error(`Unexpected root at-rule: @${node.name}`);
	}
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
		rules.some((rule) =>
			rule.nodes.some(
				(node) => node.type === 'decl' && node.prop === property && node.value === value,
			),
		),
	).toBe(true);
}

function assertClassOwnership(root: Root, className: string, layerName: string): void {
	const rules = getRulesForClass(root, className);
	expect(rules.length).toBeGreaterThan(0);
	for (const rule of rules) expect(getOwningLayer(rule)).toBe(layerName);
	expect(rules.some((rule) => rule.nodes.some((node) => node.type === 'decl'))).toBe(true);
}

function assertTextTrimOwnership(root: Root, textClassesBySize: TextClassesBySize): void {
	for (const size of fontSizeSteps) {
		const rules = textClassesBySize[size].flatMap((className) => getRulesForClass(root, className));
		assertPseudoDeclaration(
			rules,
			'::before',
			'margin-block-end',
			`var(--luke-font-${size}-cap-height-trim)`,
		);
		assertPseudoDeclaration(
			rules,
			'::after',
			'margin-block-start',
			`var(--luke-font-${size}-baseline-trim)`,
		);
	}
}

function assertLineClampOwnership(root: Root, { numeric, singleLine }: LineClampClasses): void {
	const singleLineRules = singleLine.flatMap((className) => getRulesForClass(root, className));
	assertDeclaration(singleLineRules, 'display', 'block');
	assertDeclaration(singleLineRules, 'text-overflow', 'ellipsis');
	assertDeclaration(singleLineRules, 'white-space', 'nowrap');

	for (const lineClamp of numericLineClampVariants) {
		const rules = numeric[lineClamp].flatMap((className) => getRulesForClass(root, className));
		assertDeclaration(rules, 'display', '-webkit-box');
		assertDeclaration(rules, '-webkit-box-orient', 'vertical');
		assertDeclaration(rules, '-webkit-line-clamp', String(lineClamp));
		assertDeclaration(rules, 'line-clamp', String(lineClamp));
	}
}

function assertDeclaration(rules: Array<Rule>, property: string, value: string): void {
	const matchingRules = rules.filter((rule) =>
		rule.nodes.some(
			(node) => node.type === 'decl' && node.prop === property && node.value === value,
		),
	);
	expect(matchingRules.length).toBeGreaterThan(0);
	for (const rule of matchingRules) expect(getOwningLayer(rule)).toBe('recipes');
}

function assertPseudoDeclaration(
	rules: Array<Rule>,
	pseudo: string,
	property: string,
	value: string,
): void {
	const matchingRules = rules.filter(
		(rule) =>
			hasPseudo(rule, pseudo) &&
			rule.nodes.some(
				(node) => node.type === 'decl' && node.prop === property && node.value === value,
			),
	);
	expect(matchingRules.length).toBeGreaterThan(0);
	for (const rule of matchingRules) expect(getOwningLayer(rule)).toBe('recipes');
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

const validStylesheetFixture = `@layer reset;
@layer theme;
@layer recipes;
@layer utilities;
@layer reset {
  .luke-ui-reset { box-sizing: border-box; }
}
@layer theme {
  .luke-ui-theme {
    color: var(--luke-color-text-primary);
    font-family: var(--luke-font-family);
  }
}
@layer recipes {
  .recipe-class { display: inline-flex; }
}
@layer utilities {
  .utility-class { display: grid; }
}
@keyframes generated-animation {
  from { opacity: 0; }
  to { opacity: 1; }
}`;

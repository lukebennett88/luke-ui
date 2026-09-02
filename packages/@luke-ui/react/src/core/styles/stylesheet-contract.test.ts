import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import type { AtRule, Root, Rule } from 'postcss';
import { parse } from 'postcss';
import selectorParser from 'postcss-selector-parser';
import { expect, test } from 'vite-plus/test';
import { createStylexStylesheet } from '../../../stylex-vite-plugin.js';
import type { TypeStyle } from '../../theme/contract.js';
import { typeStyles } from '../../theme/contract.js';

const lukeOwnedLayerNames = ['reset', 'theme', 'base', 'components', 'utilities'] as const;
const lukeOwnedLayerNameSet = new Set<string>(lukeOwnedLayerNames);
const STYLEX_PRIORITY_LAYER_PATTERN = /^recipes\.sx\.priority\d+$/;

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

		assertPrivateStylesheetSentinel(root);
		assertStylesheetContract(stylesheet, {
			lineClampClasses,
			recipeClasses,
			textClassesByTypography,
			utilityClasses,
		});
	},
);

const camelCaseLogicalPropertyKey =
	/\b(?:(?:min|max)?(?:Inline|Block)Size|(?:margin|padding|inset|border)(?:Block|Inline)(?:Start|End)?)\s*:/;

test('migrated StyleX source keeps quoted logical keys that StyleX would otherwise lower', async () => {
	const sourceRoot = fileURLToPath(new URL('../..', import.meta.url));
	const filenames = await findMigratedStylexSources(sourceRoot);
	expect(filenames.length).toBeGreaterThan(0);

	const sources = await Promise.all(
		filenames.map(async (filename) => ({ filename, source: await readFile(filename, 'utf8') })),
	);
	for (const { filename, source } of sources) {
		const match = source.match(camelCaseLogicalPropertyKey);
		if (match === null) continue;
		throw new Error(`${filename} uses camelCase logical StyleX key "${match[0].trim()}"`);
	}
});

const stylesheetMutations: Array<[string, (css: string) => string]> = [
	['missing stable selector', (css: string) => css.replace('.luke-ui-theme', '.theme-root')],
	['extra stable selector', (css: string) => `${css}\n@layer theme { .luke-ui-extra {} }`],
	[
		'reordered authoritative layer declarations',
		(css: string) => {
			return css.replace(
				/^@layer reset, theme, base, recipes\.sx\.priority\d+(?:, recipes\.sx\.priority\d+)*, components, utilities;/m,
				'@layer theme, reset, base, recipes.sx.priority1, components, utilities;',
			);
		},
	],
	[
		'early individual layer declarations before authoritative order',
		(css: string) => {
			return css.replace(
				/^@layer reset, theme, base, recipes\.sx\.priority\d+(?:, recipes\.sx\.priority\d+)*, components, utilities;\n/m,
				'@layer reset;\n@layer theme;\n@layer components;\n@layer utilities;\n@layer reset, theme, base, recipes.sx.priority1, components, utilities;\n',
			);
		},
	],
	[
		'early layer block before authoritative order',
		(css: string) => {
			return css.replace(
				/^@layer reset, theme, base, recipes\.sx\.priority\d+(?:, recipes\.sx\.priority\d+)*, components, utilities;\n/m,
				'@layer components { .early {} }\n@layer reset, theme, base, recipes.sx.priority1, components, utilities;\n',
			);
		},
	],
	['anonymous layer statement', (css: string) => `${css}\n@layer;`],
	['anonymous layer block', (css: string) => `${css}\n@layer { .anonymous {} }`],
	['unknown layer', (css: string) => `${css}\n@layer overlays;`],
	['nested layer', (css: string) => `${css}\n@layer components { @layer utilities {} }`],
	['root qualified rule', (css: string) => `${css}\n.root-rule { color: red; }`],
	['lookalike layer at-rule', (css: string) => `${css}\n@layered {}`],
	[
		'representative StyleX class moved to the wrong layer',
		(css: string) => {
			return css.replace(
				'@layer recipes.sx.priority1 {\n  .recipe-class { display: inline-flex; }\n}',
				'@layer utilities {\n  .recipe-class { display: inline-flex; }\n}',
			);
		},
	],
	[
		'representative utility class moved to the wrong layer',
		(css: string) => {
			return css.replace(
				'@layer utilities {\n  .utility-class { display: grid; }\n}',
				'@layer components {\n  .utility-class { display: grid; }\n}',
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
				/^(@layer reset, theme, base, recipes\.sx\.priority\d+(?:, recipes\.sx\.priority\d+)*, components, utilities;\n)/m,
				'$1@layer components;\n',
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

function assertPrivateStylesheetSentinel(root: Root): void {
	const rules = collectSkeletonInlineRules(root);
	expect(rules.length).toBeGreaterThan(0);
	for (const rule of rules) {
		const layer = getOwningLayer(rule);
		expect(layer !== undefined && STYLEX_PRIORITY_LAYER_PATTERN.test(layer)).toBe(true);
	}
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
	for (const rule of maskRules) expect(getOwningLayer(rule)).toBe('components');
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
	expect(priorityLayers.every((name, index) => name === `recipes.sx.priority${index + 1}`)).toBe(
		true,
	);

	expect(order.slice(3 + priorityLayers.length)).toEqual(['components', 'utilities']);
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
 * Text is StyleX-migrated: its trim and line-clamp classes live in a `recipes.sx.priorityN`
 * layer. `assertTextTrimOwnership` and `assertLineClampOwnership` below assert that StyleX
 * ownership directly. Text uses quoted logical CSS keys, which StyleX emits without lowering
 * to physical properties.
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
			'margin-block-end',
			`var(--luke-font-${typography}-cap-height-trim)`,
		);
		assertPseudoDeclaration(
			rules,
			'::after',
			'margin-block-start',
			`var(--luke-font-${typography}-baseline-trim)`,
		);
		assertNoPhysicalTrimMargins(rules, '::before');
		assertNoPhysicalTrimMargins(rules, '::after');
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

function assertNoPhysicalTrimMargins(rules: Array<Rule>, pseudo: string): void {
	for (const rule of rules) {
		if (!hasPseudo(rule, pseudo)) continue;
		for (const node of rule.nodes) {
			if (node.type !== 'decl') continue;
			if (node.prop !== 'margin-top' && node.prop !== 'margin-bottom') continue;
			throw new Error(
				`Text trim ${pseudo} emitted physical ${node.prop}; expected margin-block-* keys.`,
			);
		}
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
				node.prop === 'min-inline-size' &&
				node.value.includes('20ch') &&
				node.value.includes('--luke-control-size-combobox-action'),
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

const validStylesheetFixture = `@layer reset, theme, base, recipes.sx.priority1, components, utilities;
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
@layer components {
  .components-class { margin-block-start: 1px; }
}
@layer utilities {
  .utility-class { display: grid; }
}
@layer recipes.sx.priority1 {
  .recipe-class { display: inline-flex; }
}
@layer recipes.sx.priority1 {
  .stylex-class { outline-color: transparent; }
}
@keyframes generated-animation {
  from { opacity: 0; }
  to { opacity: 1; }
}`;

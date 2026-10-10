import { Box } from '@luke-ui/react/box';
import { iconRecipe } from '@luke-ui/react/icon';
import { textRecipe } from '@luke-ui/react/text';
import { expect, test } from 'vite-plus/test';
import builtCss from '../../../dist/stylesheet.css?inline';
import { capsizeTrimVarName } from '../../theme/capsize-trim-vars.js';
import { typeStyles } from '../../theme/type-styles.js';
import { render } from '../test-utils/render.js';
import { cascadeLayerOrder } from './layer-names.js';

// The built `dist/stylesheet.css`, parsed by the browser. `cssText` is the browser's normal form, so
// these checks do not depend on how the build formats the file.

const layerOrder = ['base', 'luke-ui', 'luke-ui.reset', 'luke-ui.recipes', 'luke-ui.utilities'];

/**
 * The whole global stylesheet. Every other rule belongs to a component. Read
 * `research/717-global-stylesheet-contract.md` before changing it.
 */
const globalRules = [
	[':where(*), :where(*)::before, :where(*)::after', 'box-sizing: border-box;'],
	[':where(:root)', 'container-type: inline-size;'],
	[
		':where(body)',
		'accent-color: var(--luke-color-background-accent-solid-rest); background-color: var(--luke-color-surface-base); color: var(--luke-color-text-primary); font-family: var(--luke-font-body-font-family); font-size: var(--luke-font-body-font-size); font-weight: var(--luke-font-body-font-weight); letter-spacing: var(--luke-font-body-letter-spacing); line-height: 1.5; margin: 0px;',
	],
	[
		':where(body [data-color-mode="light"], body [data-color-mode="dark"])',
		'accent-color: var(--luke-color-background-accent-solid-rest); background-color: var(--luke-color-surface-base); color: var(--luke-color-text-primary);',
	],
	[':where(button, input, select, textarea)', 'font: inherit; margin: 0px;'],
	[
		':where(:focus-visible)',
		'outline-color: var(--luke-color-border-focus); outline-offset: 2px; outline-style: solid; outline-width: 2px;',
	],
	['@media (forced-colors: active) :where(:focus-visible)', 'outline-color: highlight;'],
];

type ParsedRule = { layer: string; media: string; rule: CSSStyleRule };

/** Layers by full name in the order the stylesheet creates them, and every style rule. */
function parseStylesheet(css: string) {
	const sheet = new CSSStyleSheet();
	sheet.replaceSync(css);
	const layers: Array<string> = [];
	const rules: Array<ParsedRule> = [];
	function visit(list: CSSRuleList, layer: string, media: string) {
		for (const rule of list) {
			const qualify = (name: string) => (layer ? `${layer}.${name}` : name);
			if (rule instanceof CSSLayerStatementRule) {
				for (const name of rule.nameList)
					if (!layers.includes(qualify(name))) layers.push(qualify(name));
			} else if (rule instanceof CSSLayerBlockRule) {
				if (!layers.includes(qualify(rule.name))) layers.push(qualify(rule.name));
				visit(rule.cssRules, qualify(rule.name), media);
			} else if (rule instanceof CSSStyleRule) {
				rules.push({ layer, media, rule });
			} else if (rule instanceof CSSMediaRule) {
				visit(rule.cssRules, layer, rule.conditionText);
			} else if (rule instanceof CSSGroupingRule) {
				visit(rule.cssRules, layer, media);
			}
		}
	}
	visit(sheet.cssRules, '', '');
	return { layers, rules };
}

function rulesFor(rules: Array<ParsedRule>, className: string) {
	const pattern = new RegExp(`\\.${CSS.escape(className)}(?![\\w-])`);
	return rules.filter(({ rule }) => pattern.test(rule.selectorText));
}

function expectOwnedBy(rules: Array<ParsedRule>, classNames: Array<string>, layer: string) {
	for (const className of classNames) {
		const owned = rulesFor(rules, className);
		expect(owned.length, `.${className} has rules`).toBeGreaterThan(0);
		expect(new Set(owned.map((entry) => entry.layer)), `.${className} layer`).toEqual(
			new Set([layer]),
		);
	}
}

function expectLayerContract(css: string) {
	const { layers, rules } = parseStylesheet(css);

	expect(css.startsWith(`${cascadeLayerOrder}\n`), 'order statement first').toBe(true);
	expect(layers, 'layer order').toEqual(layerOrder);
	expect(
		rules.filter(({ layer }) => layer === '' || layer === 'base').map(({ rule }) => rule.cssText),
		'unlayered or base rules',
	).toEqual([]);
	expect(
		rules
			.filter(({ rule }) => rule.selectorText.includes('.luke-ui-'))
			.map(({ rule }) => rule.cssText),
		'root class selectors',
	).toEqual([]);
	expect(
		rules
			.filter(({ layer }) => layer === 'luke-ui.reset')
			.map(({ media, rule }) => [
				media ? `@media ${media} ${rule.selectorText}` : rule.selectorText,
				rule.style.cssText,
			]),
		'global rules',
	).toEqual(globalRules);
	expectOwnedBy(rules, iconRecipe({ size: 'medium' }).split(' '), 'luke-ui.recipes');
}

test('builds the public stylesheet with the layer and global-rule contract', () => {
	expect(() => expectLayerContract(builtCss)).not.toThrow();
});

test('puts utility props in the utilities layer', () => {
	const { container } = render(<Box display="grid" padding="sp4" />);
	const { rules } = parseStylesheet(builtCss);

	const classNames = container.firstElementChild?.className.split(' ') ?? [];

	expect(classNames.length).toBeGreaterThan(0);
	expect(() => expectOwnedBy(rules, classNames, 'luke-ui.utilities')).not.toThrow();
});

test('trims every type style with its own Capsize variables', () => {
	const { rules } = parseStylesheet(builtCss);

	for (const typography of typeStyles) {
		const textRules = textRecipe({ typography })
			.split(' ')
			.flatMap((className) => rulesFor(rules, className))
			.filter(({ layer }) => layer === 'luke-ui.recipes');
		const trimmed = (pseudo: string, property: string, variable: string) =>
			textRules.some(
				({ rule }) =>
					rule.selectorText.endsWith(pseudo) &&
					rule.style.getPropertyValue(property) === `var(${variable})`,
			);

		expect(
			trimmed('::before', 'margin-block-end', capsizeTrimVarName(typography, 'capHeightTrim')),
			`${typography} cap height trim`,
		).toBe(true);
		expect(
			trimmed('::after', 'margin-block-start', capsizeTrimVarName(typography, 'baselineTrim')),
			`${typography} baseline trim`,
		).toBe(true);
	}
});

test('emits single-line and multi-line clamps', () => {
	const { rules } = parseStylesheet(builtCss);
	const styleFor = (lineClamp: true | 3) =>
		textRecipe({ lineClamp })
			.split(' ')
			.flatMap((className) => rulesFor(rules, className))
			.map(({ rule }) => rule.style);

	expect(
		styleFor(true).some(
			(style) => style.textOverflow === 'ellipsis' && style.whiteSpace === 'nowrap',
		),
	).toBe(true);
	expect(
		styleFor(3).some(
			(style) =>
				style.display === '-webkit-box' && style.getPropertyValue('-webkit-line-clamp') === '3',
		),
	).toBe(true);
});

// `!important` reverses layer order, so the mask must stay in `recipes` to beat utilities.
test('keeps the LoadingSkeleton important mask in recipes', () => {
	const masks = parseStylesheet(builtCss).rules.filter(
		({ rule }) =>
			rule.selectorText.includes('[data-skeleton-inline]') &&
			rule.style.getPropertyPriority('background-color') === 'important',
	);

	expect(masks.length).toBeGreaterThan(0);
	expect(new Set(masks.map(({ layer }) => layer))).toEqual(new Set(['luke-ui.recipes']));
});

test('queries responsive conditions on the logical inline axis', () => {
	expect(builtCss).toContain('@container (inline-size >=');
	expect(builtCss).not.toContain('@container (width >=');
});

const iconClass = iconRecipe({ size: 'medium' }).split(' ')[0];

const mutations: Array<[string, RegExp, (css: string) => string]> = [
	[
		'reordered top-level layers',
		/order statement first/,
		(css) => css.replace('@layer base, luke-ui;', '@layer luke-ui, base;'),
	],
	[
		'reordered Luke UI layers',
		/order statement first/,
		(css) => css.replace('@layer reset, recipes, utilities;', '@layer reset, utilities, recipes;'),
	],
	['layer created early', /order statement first/, (css) => `@layer luke-ui.utilities;\n${css}`],
	['unknown layer', /layer order/, (css) => `${css}\n@layer components { .x { color: red; } }`],
	[
		'rule in base',
		/unlayered or base rules/,
		(css) => `${css}\n@layer base { .x { color: red; } }`,
	],
	['unlayered rule', /unlayered or base rules/, (css) => `${css}\n.x { color: red; }`],
	[
		'root class',
		/root class selectors/,
		(css) => `${css}\n@layer luke-ui.recipes { .luke-ui-theme { color: red; } }`,
	],
	[
		'extra global rule',
		/global rules/,
		(css) => `${css}\n@layer luke-ui.reset { :where(ul) { list-style: none; } }`,
	],
	[
		'extra declaration in a global rule',
		/global rules/,
		(css) =>
			css.replace(
				'line-height: 1.5;',
				'line-height: 1.5;\n    text-rendering: optimizeLegibility;',
			),
	],
	[
		'wrong colour-mode value in the repaint rule',
		/global rules/,
		(css) => css.replace("body [data-color-mode='dark']", "body [data-color-mode='dim']"),
	],
	[
		'forced-colours focus outside its media query',
		/global rules/,
		// Component recipes use this media query too, and build order can put one first.
		(css) =>
			css.replace(
				'@media (forced-colors: active) {\n    :where(:focus-visible)',
				'@media (prefers-contrast: more) {\n    :where(:focus-visible)',
			),
	],
	[
		'recipe class in the utilities layer',
		/\.\S+ layer/,
		(css) => `${css}\n@layer luke-ui.utilities { .${iconClass} { color: red; } }`,
	],
];

for (const [name, reason, mutate] of mutations) {
	test(`rejects a stylesheet with a ${name}`, () => {
		const mutated = mutate(builtCss);

		expect(mutated).not.toBe(builtCss);
		expect(() => expectLayerContract(mutated)).toThrow(reason);
	});
}

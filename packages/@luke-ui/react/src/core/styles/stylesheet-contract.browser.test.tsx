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
	// Chromium's cssText folds `-webkit-text-size-adjust` into `text-size-adjust`. The built
	// stylesheet still emits both declarations so Safari reads the prefixed form.
	[':where(:root)', 'container-type: inline-size; text-size-adjust: 100%;'],
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
		const qualify = (name: string) => (layer ? `${layer}.${name}` : name);
		for (const rule of list) {
			if (rule instanceof CSSLayerStatementRule) {
				for (const name of rule.nameList) {
					if (!layers.includes(qualify(name))) layers.push(qualify(name));
				}
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

test('builds the public stylesheet with the layer and global-rule contract', () => {
	const { layers, rules } = parseStylesheet(builtCss);

	expect(builtCss.startsWith(`${cascadeLayerOrder}\n`), 'order statement first').toBe(true);
	expect(layers, 'layer order').toEqual(layerOrder);
	expect(
		rules.filter(({ layer }) => layer === '' || layer === 'base').map(({ rule }) => rule.cssText),
		'unlayered or base rules',
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
	// Chromium folds the prefix away in cssText above. Assert the raw file so Safari's form cannot
	// disappear while the contract still passes.
	expect(builtCss).toContain('-webkit-text-size-adjust: 100%');
	expectOwnedBy(rules, iconRecipe({ size: 'px24' }).split(' '), 'luke-ui.recipes');
});

test('puts utility props in the utilities layer', () => {
	const { container } = render(<Box display="grid" padding="space.4" />);
	const { rules } = parseStylesheet(builtCss);

	const classNames = container.firstElementChild?.className.split(' ') ?? [];

	expect(classNames.length).toBeGreaterThan(0);
	expectOwnedBy(rules, classNames, 'luke-ui.utilities');
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

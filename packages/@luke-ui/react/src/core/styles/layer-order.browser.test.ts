import '../../../dist/themes/tactile/stylesheet.css';
import { afterAll, afterEach, beforeAll, expect, test } from 'vite-plus/test';
import builtStylesheetCss from '../../../dist/stylesheet.css?inline';
import { loadingSkeletonScopeAttribute } from '../loading-skeleton/scope.js';

// `scope.ts` is side-effect-free, so it's safe to import here. Do not import
// `loading-skeleton/styles.css.ts` itself: VE `globalLayer()` would create the `recipes`/`utilities`
// layers before this file injects the dist stylesheet, and the combined `@layer` order cannot then
// place StyleX priority layers ahead of them.

const mounted: Array<HTMLElement> = [];
const STYLESHEET_ELEMENT_ID = 'luke-ui-layer-order-stylesheet';
const stylesheetCss = builtStylesheetCss;

beforeAll(() => {
	const style = document.head.appendChild(document.createElement('style'));
	style.id = STYLESHEET_ELEMENT_ID;
	style.textContent = stylesheetCss;
});

afterAll(() => {
	document.getElementById(STYLESHEET_ELEMENT_ID)?.remove();
});

afterEach(() => {
	for (const element of mounted) element.remove();
	mounted.length = 0;
	for (const style of document.querySelectorAll('style[data-layer-order-probe]')) style.remove();
});

/** The `Button` recipe's `sizeMedium` variant emits this as an isolated atomic declaration. */
function stylexPaddingClass(stylesheet: string): string {
	const stylexSection = stylesheet.split('/* stylex */')[1] ?? '';
	const paddingClass = stylexSection.match(
		/\.([a-z0-9]+)\{padding-inline:var\(--luke-space-sp16\)\}/,
	)?.[1];
	if (paddingClass == null) {
		throw new Error('Expected StyleX padding class in the built stylesheet.');
	}
	return paddingClass;
}

/** Several real recipes (Icon, Kbd, Checkbox, and others) share this isolated atomic declaration. */
function stylexInlineFlexClass(stylesheet: string): string {
	const stylexSection = stylesheet.split('/* stylex */')[1] ?? '';
	const inlineFlexClass = stylexSection.match(/\.([a-z0-9]+)\{display:inline-flex\}/)?.[1];
	if (inlineFlexClass == null) {
		throw new Error('Expected StyleX inline-flex class in the built stylesheet.');
	}
	return inlineFlexClass;
}

function mountProbe(className: string): HTMLDivElement {
	const element = document.body.appendChild(document.createElement('div'));
	mounted.push(element);
	element.className = className;
	return element;
}

test('a direct recipes-layer rule beats the recipe sublayers in the built stylesheet cascade', () => {
	const paddingClass = stylexPaddingClass(stylesheetCss);
	const element = mountProbe(paddingClass);

	expect(getComputedStyle(element).paddingInlineStart).toBe('16px');

	// Written directly into `@layer recipes`, not a nested `recipes.priorityN` sublayer — the same
	// shape retained CSS (Prose rhythm, LoadingSkeleton's forced surface, Combobox's section
	// border) uses to reliably override StyleX recipe output. See `layers.css.ts`.
	const recipesStyle = document.head.appendChild(document.createElement('style'));
	recipesStyle.dataset.layerOrderProbe = 'true';
	recipesStyle.textContent = `@layer recipes { .${paddingClass} { padding-inline: 10px; } }`;

	expect(getComputedStyle(element).paddingInlineStart).toBe('10px');
});

test('utilities beat the recipe layers in the built stylesheet cascade', () => {
	const paddingClass = stylexPaddingClass(stylesheetCss);
	const element = mountProbe(paddingClass);

	expect(getComputedStyle(element).paddingInlineStart).toBe('16px');

	const utilityStyle = document.head.appendChild(document.createElement('style'));
	utilityStyle.dataset.layerOrderProbe = 'true';
	utilityStyle.textContent = `@layer utilities { .${paddingClass} { padding-inline: 20px; } }`;

	expect(getComputedStyle(element).paddingInlineStart).toBe('20px');
});

test('utilities beat a direct recipes-layer rule in the built stylesheet cascade', () => {
	const paddingClass = stylexPaddingClass(stylesheetCss);
	const element = mountProbe(paddingClass);

	expect(getComputedStyle(element).paddingInlineStart).toBe('16px');

	const recipesStyle = document.head.appendChild(document.createElement('style'));
	recipesStyle.dataset.layerOrderProbe = 'true';
	recipesStyle.textContent = `@layer recipes { .${paddingClass} { padding-inline: 10px; } }`;
	expect(getComputedStyle(element).paddingInlineStart).toBe('10px');

	const utilityStyle = document.head.appendChild(document.createElement('style'));
	utilityStyle.dataset.layerOrderProbe = 'true';
	utilityStyle.textContent = `@layer utilities { .${paddingClass} { padding-inline: 20px; } }`;

	expect(getComputedStyle(element).paddingInlineStart).toBe('20px');
});

test('unlayered consumer CSS beats the recipe layers', () => {
	const paddingClass = stylexPaddingClass(stylesheetCss);
	const element = mountProbe(paddingClass);

	expect(getComputedStyle(element).paddingInlineStart).toBe('16px');

	const consumerStyle = document.head.appendChild(document.createElement('style'));
	consumerStyle.dataset.layerOrderProbe = 'true';
	consumerStyle.textContent = `.${paddingClass} { padding-inline: 30px; }`;

	expect(getComputedStyle(element).paddingInlineStart).toBe('30px');
});

test('reproduces the invalid early layer-declaration failure mode', () => {
	const style = document.head.appendChild(document.createElement('style'));
	style.dataset.layerOrderProbe = 'true';
	style.textContent = `
@layer probe-reset;
@layer probe-theme;
@layer probe-utilities;
@layer probe-reset, probe-theme, probe-recipes.priority1, probe-utilities;
@layer probe-recipes.priority1 { .probe-invalid { padding-inline: 16px; } }
@layer probe-utilities { .probe-invalid { padding-inline: 20px; } }
`;

	const element = mountProbe('probe-invalid');

	expect(getComputedStyle(element).paddingInlineStart).toBe('16px');
});

test('the documented consumer layer declaration preserves Luke UI and consumer override ordering', () => {
	// Keep this declaration in sync with the Styling guide.
	const documentedLayerDeclaration = '@layer reset, theme, base, recipes, overrides, utilities;';

	const paddingClass = stylexPaddingClass(stylesheetCss);
	const element = mountProbe(paddingClass);

	expect(getComputedStyle(element).paddingInlineStart).toBe('16px');

	// Insert the consumer declaration first because browsers keep the first layer order they see.
	const consumerStyle = document.createElement('style');
	consumerStyle.dataset.layerOrderProbe = 'true';
	consumerStyle.textContent = `
${documentedLayerDeclaration}
@layer recipes { .${paddingClass} { padding-inline: 40px; } }
`;
	document.head.insertBefore(consumerStyle, document.head.firstChild);

	// A direct `recipes` rule beats StyleX's nested recipe layers.
	expect(getComputedStyle(element).paddingInlineStart).toBe('40px');

	// Use a separate class to probe `overrides` and `utilities`.
	const orderingProbeClass = 'documented-declaration-ordering-probe';
	const orderingElement = mountProbe(orderingProbeClass);

	const normalOrderingStyle = document.head.appendChild(document.createElement('style'));
	normalOrderingStyle.dataset.layerOrderProbe = 'true';
	normalOrderingStyle.textContent = `
@layer overrides { .${orderingProbeClass} { color: rgb(1, 1, 1); } }
@layer utilities { .${orderingProbeClass} { color: rgb(2, 2, 2); } }
`;

	// Relationship 2: a normal `utilities` rule beats a normal `overrides` rule.
	expect(getComputedStyle(orderingElement).color).toBe('rgb(2, 2, 2)');

	const importantOrderingStyle = document.head.appendChild(document.createElement('style'));
	importantOrderingStyle.dataset.layerOrderProbe = 'true';
	importantOrderingStyle.textContent = `
@layer overrides { .${orderingProbeClass} { margin-top: 5px !important; } }
@layer utilities { .${orderingProbeClass} { margin-top: 9px !important; } }
`;

	// Layer priority reverses for `!important` declarations.
	expect(getComputedStyle(orderingElement).marginTop).toBe('5px');

	// Relationship 4: unlayered consumer CSS beats every layered normal declaration.
	const unlayeredStyle = document.head.appendChild(document.createElement('style'));
	unlayeredStyle.dataset.layerOrderProbe = 'true';
	unlayeredStyle.textContent = `.${orderingProbeClass} { color: rgb(3, 3, 3); }`;

	expect(getComputedStyle(orderingElement).color).toBe('rgb(3, 3, 3)');
});

test('application base-layer element resets do not override Luke UI component styles', () => {
	// Keep this declaration in sync with the Styling guide.
	const documentedLayerDeclaration = '@layer reset, theme, base, recipes, overrides, utilities;';

	const inlineFlexClass = stylexInlineFlexClass(stylesheetCss);

	// Insert the consumer declaration first because browsers keep the first layer order they see.
	const consumerStyle = document.createElement('style');
	consumerStyle.dataset.layerOrderProbe = 'true';
	consumerStyle.textContent = `
${documentedLayerDeclaration}
@layer base { svg { display: block; } }
`;
	document.head.insertBefore(consumerStyle, document.head.firstChild);

	const element = document.body.appendChild(
		document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
	);
	mounted.push(element as unknown as HTMLElement);
	element.setAttribute('class', inlineFlexClass);

	// A Tailwind-Preflight-shaped `base` layer rule (`svg { display: block }`) must not beat Luke
	// UI's StyleX recipe styles (`display: inline-flex`), because `base` sits below `recipes`.
	expect(getComputedStyle(element).display).toBe('inline-flex');

	const overridesStyle = document.head.appendChild(document.createElement('style'));
	overridesStyle.dataset.layerOrderProbe = 'true';
	overridesStyle.textContent = `@layer overrides { .${inlineFlexClass} { display: flex; } }`;

	// A deliberate application `overrides` override still wins, because `overrides` sits above
	// `recipes`.
	expect(getComputedStyle(element).display).toBe('flex');
});

test('LoadingSkeleton recipes !important beats utilities-layer !important overrides', () => {
	const element = document.body.appendChild(document.createElement('div'));
	mounted.push(element);
	element.setAttribute(loadingSkeletonScopeAttribute, '');
	element.innerHTML = '<span>child</span>';

	const utilityStyle = document.head.appendChild(document.createElement('style'));
	utilityStyle.dataset.layerOrderProbe = 'true';
	utilityStyle.textContent = `@layer utilities { [${loadingSkeletonScopeAttribute}]:not([data-skeleton-inline]) > * { background-color: red !important; } }`;

	expect(getComputedStyle(element.firstElementChild!).backgroundColor).not.toBe('rgb(255, 0, 0)');
});

import '../../../dist/themes/tactile/stylesheet.css';
import { afterAll, afterEach, beforeAll, expect, test } from 'vite-plus/test';
import builtStylesheetCss from '../../../dist/stylesheet.css?inline';

// Literal from `loading-skeleton/styles.css.ts`. Do not import that module: VE `globalLayer()`
// would create structural/utilities before this file injects the dist stylesheet, and the combined
// `@layer` order cannot then place StyleX priority layers ahead of them.
const loadingSkeletonScopeClassName = 'loading-skeleton';

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

function stylexPaddingClass(stylesheet: string): string {
	const stylexSection = stylesheet.split('/* stylex */')[1] ?? '';
	const paddingClass = stylexSection.match(
		/\.([a-z0-9]+)\{padding:var\(--luke-space-sp16\)\}/,
	)?.[1];
	if (paddingClass == null) {
		throw new Error('Expected StyleX padding fixture class in the built stylesheet.');
	}
	return paddingClass;
}

function mountProbe(className: string): HTMLDivElement {
	const element = document.body.appendChild(document.createElement('div'));
	mounted.push(element);
	element.className = className;
	return element;
}

test('structural beats StyleX priority layers in the built stylesheet cascade', () => {
	const paddingClass = stylexPaddingClass(stylesheetCss);
	const element = mountProbe(paddingClass);

	expect(getComputedStyle(element).paddingTop).toBe('16px');

	const structuralStyle = document.head.appendChild(document.createElement('style'));
	structuralStyle.dataset.layerOrderProbe = 'true';
	structuralStyle.textContent = `@layer structural { .${paddingClass} { padding-top: 10px; } }`;

	expect(getComputedStyle(element).paddingTop).toBe('10px');
});

test('utilities beat StyleX priority layers in the built stylesheet cascade', () => {
	const paddingClass = stylexPaddingClass(stylesheetCss);
	const element = mountProbe(paddingClass);

	expect(getComputedStyle(element).paddingTop).toBe('16px');

	const utilityStyle = document.head.appendChild(document.createElement('style'));
	utilityStyle.dataset.layerOrderProbe = 'true';
	utilityStyle.textContent = `@layer utilities { .${paddingClass} { padding-top: 20px; } }`;

	expect(getComputedStyle(element).paddingTop).toBe('20px');
});

test('utilities beat structural in the built stylesheet cascade', () => {
	const paddingClass = stylexPaddingClass(stylesheetCss);
	const element = mountProbe(paddingClass);

	expect(getComputedStyle(element).paddingTop).toBe('16px');

	const structuralStyle = document.head.appendChild(document.createElement('style'));
	structuralStyle.dataset.layerOrderProbe = 'true';
	structuralStyle.textContent = `@layer structural { .${paddingClass} { padding-top: 10px; } }`;
	expect(getComputedStyle(element).paddingTop).toBe('10px');

	const utilityStyle = document.head.appendChild(document.createElement('style'));
	utilityStyle.dataset.layerOrderProbe = 'true';
	utilityStyle.textContent = `@layer utilities { .${paddingClass} { padding-top: 20px; } }`;

	expect(getComputedStyle(element).paddingTop).toBe('20px');
});

test('unlayered consumer CSS beats StyleX priority layers', () => {
	const paddingClass = stylexPaddingClass(stylesheetCss);
	const element = mountProbe(paddingClass);

	expect(getComputedStyle(element).paddingTop).toBe('16px');

	const consumerStyle = document.head.appendChild(document.createElement('style'));
	consumerStyle.dataset.layerOrderProbe = 'true';
	consumerStyle.textContent = `.${paddingClass} { padding-top: 30px; }`;

	expect(getComputedStyle(element).paddingTop).toBe('30px');
});

test('reproduces the invalid early layer-declaration failure mode', () => {
	const style = document.head.appendChild(document.createElement('style'));
	style.dataset.layerOrderProbe = 'true';
	style.textContent = `
@layer probe-reset;
@layer probe-theme;
@layer probe-structural;
@layer probe-utilities;
@layer probe-reset, probe-theme, probe-luke.sx.priority1, probe-structural, probe-utilities;
@layer probe-luke.sx.priority1 { .probe-invalid { padding-top: 16px; } }
@layer probe-structural { .probe-invalid { padding-top: 10px; } }
@layer probe-utilities { .probe-invalid { padding-top: 20px; } }
`;

	const element = mountProbe('probe-invalid');

	expect(getComputedStyle(element).paddingTop).toBe('16px');
});

test('the documented consumer layer declaration preserves Luke UI and consumer override ordering', () => {
	// This is the exact declaration published in the Styling guide
	// (apps/docs/content/docs/docs/styling.mdx, "Use application CSS alongside Luke UI"). Keep the
	// two in sync: if this literal changes, update the docs too, and vice versa.
	const documentedLayerDeclaration =
		'@layer reset, theme, luke, structural, base, components, utilities;';

	const paddingClass = stylexPaddingClass(stylesheetCss);
	const element = mountProbe(paddingClass);

	expect(getComputedStyle(element).paddingTop).toBe('16px');

	// A browser registers layer order from the first `@layer` statement it encounters, and a later
	// statement cannot reorder layers that are already registered. The built stylesheet's own
	// `@layer` statement was already injected in `beforeAll`, so the consumer declaration must be
	// inserted ahead of it in `document.head` to reproduce the documented, realistic setup where a
	// consumer declares its layer order before importing Luke UI's stylesheet.
	const consumerStyle = document.createElement('style');
	consumerStyle.dataset.layerOrderProbe = 'true';
	consumerStyle.textContent = `
${documentedLayerDeclaration}
@layer components { .${paddingClass} { padding-top: 40px; } }
`;
	document.head.insertBefore(consumerStyle, document.head.firstChild);

	// Relationship 1: consumer `components` CSS beats Luke UI's StyleX component styles.
	expect(getComputedStyle(element).paddingTop).toBe('40px');

	// Relationships 2 and 3 probe `structural` and `utilities` directly, since the documented
	// declaration is what fixes their relative order (an omitted `structural` would otherwise be
	// appended after `utilities` once the built stylesheet registers it). A distinct probe class
	// keeps these rules off the StyleX padding class used above.
	const orderingProbeClass = 'documented-declaration-ordering-probe';
	const orderingElement = mountProbe(orderingProbeClass);

	const normalOrderingStyle = document.head.appendChild(document.createElement('style'));
	normalOrderingStyle.dataset.layerOrderProbe = 'true';
	normalOrderingStyle.textContent = `
@layer structural { .${orderingProbeClass} { color: rgb(1, 1, 1); } }
@layer utilities { .${orderingProbeClass} { color: rgb(2, 2, 2); } }
`;

	// Relationship 2: a normal `utilities` rule beats a normal `structural` rule.
	expect(getComputedStyle(orderingElement).color).toBe('rgb(2, 2, 2)');

	const importantOrderingStyle = document.head.appendChild(document.createElement('style'));
	importantOrderingStyle.dataset.layerOrderProbe = 'true';
	importantOrderingStyle.textContent = `
@layer structural { .${orderingProbeClass} { margin-top: 5px !important; } }
@layer utilities { .${orderingProbeClass} { margin-top: 9px !important; } }
`;

	// Relationship 3: a `structural !important` rule beats a `utilities !important` rule, because
	// cascade-layer priority reverses for `!important` declarations.
	expect(getComputedStyle(orderingElement).marginTop).toBe('5px');
});

test('LoadingSkeleton structural !important beats utilities-layer !important overrides', () => {
	const element = document.body.appendChild(document.createElement('div'));
	mounted.push(element);
	element.className = loadingSkeletonScopeClassName;
	element.innerHTML = '<span>child</span>';

	const utilityStyle = document.head.appendChild(document.createElement('style'));
	utilityStyle.dataset.layerOrderProbe = 'true';
	utilityStyle.textContent = `@layer utilities { .${loadingSkeletonScopeClassName}:not([data-skeleton-inline]) > * { background-color: red !important; } }`;

	expect(getComputedStyle(element.firstElementChild!).backgroundColor).not.toBe('rgb(255, 0, 0)');
});

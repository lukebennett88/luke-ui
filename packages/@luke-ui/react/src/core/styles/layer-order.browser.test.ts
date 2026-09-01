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

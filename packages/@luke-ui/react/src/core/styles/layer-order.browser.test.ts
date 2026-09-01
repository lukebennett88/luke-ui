import '../../../dist/themes/tactile/stylesheet.css';
import { afterAll, afterEach, beforeAll, expect, test } from 'vite-plus/test';
import builtStylesheetCss from '../../../dist/stylesheet.css?inline';

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

function loadingSkeletonClassName(stylesheet: string): string {
	const match = stylesheet.match(/\.(_[a-z0-9]+)\[data-skeleton-inline\]/);
	if (match == null || match[1] == null) {
		throw new Error('Expected LoadingSkeleton class in the built stylesheet.');
	}
	return match[1];
}

test('recipes beat StyleX priority layers in the built stylesheet cascade', () => {
	const paddingClass = stylexPaddingClass(stylesheetCss);
	const element = mountProbe(paddingClass);

	expect(getComputedStyle(element).paddingTop).toBe('16px');

	const recipeStyle = document.head.appendChild(document.createElement('style'));
	recipeStyle.dataset.layerOrderProbe = 'true';
	recipeStyle.textContent = `@layer recipes { .${paddingClass} { padding-top: 10px; } }`;

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

test('utilities beat recipes in the built stylesheet cascade', () => {
	const paddingClass = stylexPaddingClass(stylesheetCss);
	const element = mountProbe(paddingClass);

	expect(getComputedStyle(element).paddingTop).toBe('16px');

	const recipeStyle = document.head.appendChild(document.createElement('style'));
	recipeStyle.dataset.layerOrderProbe = 'true';
	recipeStyle.textContent = `@layer recipes { .${paddingClass} { padding-top: 10px; } }`;
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
@layer probe-recipes;
@layer probe-structural;
@layer probe-utilities;
@layer probe-reset, probe-theme, probe-luke.sx.priority1, probe-recipes, probe-structural, probe-utilities;
@layer probe-luke.sx.priority1 { .probe-invalid { padding-top: 16px; } }
@layer probe-recipes { .probe-invalid { padding-top: 10px; } }
@layer probe-utilities { .probe-invalid { padding-top: 20px; } }
`;

	const element = mountProbe('probe-invalid');

	expect(getComputedStyle(element).paddingTop).toBe('16px');
});

test('LoadingSkeleton structural !important beats utilities-layer !important overrides', () => {
	const skeletonClass = loadingSkeletonClassName(stylesheetCss);

	const element = document.body.appendChild(document.createElement('div'));
	mounted.push(element);
	element.className = skeletonClass;
	element.innerHTML = '<span>child</span>';

	const utilityStyle = document.head.appendChild(document.createElement('style'));
	utilityStyle.dataset.layerOrderProbe = 'true';
	utilityStyle.textContent = `@layer utilities { .${skeletonClass}:not([data-skeleton-inline]) > * { background-color: red !important; } }`;

	expect(getComputedStyle(element.firstElementChild!).backgroundColor).not.toBe('rgb(255, 0, 0)');
});

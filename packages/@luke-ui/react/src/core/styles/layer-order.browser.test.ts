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

function iconBaseClassName(stylesheet: string): string {
	const match = stylesheet.match(
		/\.([a-z0-9]+) \{\n {4}display: inline-flex;\n {4}flex-shrink: 0;\n {2}\}/,
	);
	if (match == null || match[1] == null) {
		throw new Error('Expected Icon base class in the built stylesheet.');
	}
	return match[1];
}

test('a recipes-layer rule beats the layers below it in the built stylesheet cascade', () => {
	// Use a real shipped Icon class as the production probe.
	const iconClass = iconBaseClassName(stylesheetCss);
	const element = mountProbe(iconClass);

	expect(getComputedStyle(element).display).toBe('inline-flex');

	const themeStyle = document.head.appendChild(document.createElement('style'));
	themeStyle.dataset.layerOrderProbe = 'true';
	themeStyle.textContent = `@layer theme { .${iconClass} { display: block; } }`;

	expect(getComputedStyle(element).display).toBe('inline-flex');

	const baseStyle = document.head.appendChild(document.createElement('style'));
	baseStyle.dataset.layerOrderProbe = 'true';
	baseStyle.textContent = `@layer base { .${iconClass} { display: grid; } }`;

	expect(getComputedStyle(element).display).toBe('inline-flex');
});

test('utilities beat recipes in the built stylesheet cascade', () => {
	const iconClass = iconBaseClassName(stylesheetCss);
	const element = mountProbe(iconClass);

	expect(getComputedStyle(element).display).toBe('inline-flex');

	const recipeStyle = document.head.appendChild(document.createElement('style'));
	recipeStyle.dataset.layerOrderProbe = 'true';
	recipeStyle.textContent = `@layer recipes { .${iconClass} { display: block; } }`;
	expect(getComputedStyle(element).display).toBe('block');

	const utilityStyle = document.head.appendChild(document.createElement('style'));
	utilityStyle.dataset.layerOrderProbe = 'true';
	utilityStyle.textContent = `@layer utilities { .${iconClass} { display: grid; } }`;

	expect(getComputedStyle(element).display).toBe('grid');
});

test('unlayered consumer CSS beats every layer in the built stylesheet', () => {
	const iconClass = iconBaseClassName(stylesheetCss);
	const element = mountProbe(iconClass);

	expect(getComputedStyle(element).display).toBe('inline-flex');

	const utilityStyle = document.head.appendChild(document.createElement('style'));
	utilityStyle.dataset.layerOrderProbe = 'true';
	utilityStyle.textContent = `@layer utilities { .${iconClass} { display: grid; } }`;
	expect(getComputedStyle(element).display).toBe('grid');

	const consumerStyle = document.head.appendChild(document.createElement('style'));
	consumerStyle.dataset.layerOrderProbe = 'true';
	consumerStyle.textContent = `.${iconClass} { display: flow-root; }`;

	expect(getComputedStyle(element).display).toBe('flow-root');
});

test('reproduces the invalid early layer-declaration failure mode', () => {
	// Declaring individual `@layer` names before the order statement creates `base` last.
	const style = document.head.appendChild(document.createElement('style'));
	style.dataset.layerOrderProbe = 'true';
	style.textContent = `
@layer probe-reset;
@layer probe-theme;
@layer probe-recipes;
@layer probe-structural;
@layer probe-utilities;
@layer probe-reset, probe-theme, probe-base, probe-recipes, probe-structural, probe-utilities;
@layer probe-recipes { .probe-invalid { display: inline-flex; } }
@layer probe-utilities { .probe-invalid { display: grid; } }
@layer probe-base { .probe-invalid { display: block; } }
`;

	const element = mountProbe('probe-invalid');

	expect(getComputedStyle(element).display).toBe('block');
});

test('a consumer base-layer reset does not override component recipes', () => {
	// A consumer `@layer base` alone would create the layer last and beat recipes.
	const iconClass = iconBaseClassName(stylesheetCss);
	const element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	element.setAttribute('class', iconClass);
	document.body.appendChild(element);
	mounted.push(element as unknown as HTMLElement);

	const preflightStyle = document.head.appendChild(document.createElement('style'));
	preflightStyle.dataset.layerOrderProbe = 'true';
	preflightStyle.textContent = `@layer base {
  svg, video, canvas, audio, iframe, embed, object {
    display: block;
    vertical-align: middle;
  }
}`;

	expect(getComputedStyle(element).display).toBe('inline-flex');
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

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

	const resetStyle = document.head.appendChild(document.createElement('style'));
	resetStyle.dataset.layerOrderProbe = 'true';
	resetStyle.textContent = `@layer luke-ui.reset { .${iconClass} { display: block; } }`;

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
	recipeStyle.textContent = `@layer luke-ui.recipes { .${iconClass} { display: block; } }`;
	expect(getComputedStyle(element).display).toBe('block');

	const utilityStyle = document.head.appendChild(document.createElement('style'));
	utilityStyle.dataset.layerOrderProbe = 'true';
	utilityStyle.textContent = `@layer luke-ui.utilities { .${iconClass} { display: grid; } }`;

	expect(getComputedStyle(element).display).toBe('grid');
});

test('unlayered consumer CSS beats every layer in the built stylesheet', () => {
	const iconClass = iconBaseClassName(stylesheetCss);
	const element = mountProbe(iconClass);

	expect(getComputedStyle(element).display).toBe('inline-flex');

	const utilityStyle = document.head.appendChild(document.createElement('style'));
	utilityStyle.dataset.layerOrderProbe = 'true';
	utilityStyle.textContent = `@layer luke-ui.utilities { .${iconClass} { display: grid; } }`;
	expect(getComputedStyle(element).display).toBe('grid');

	const consumerStyle = document.head.appendChild(document.createElement('style'));
	consumerStyle.dataset.layerOrderProbe = 'true';
	consumerStyle.textContent = `.${iconClass} { display: flow-root; }`;

	expect(getComputedStyle(element).display).toBe('flow-root');
});

test('reproduces the invalid early layer-declaration failure mode', () => {
	// Declaring `probe-luke-ui` before the order statement creates `probe-base` after it.
	const style = document.head.appendChild(document.createElement('style'));
	style.dataset.layerOrderProbe = 'true';
	style.textContent = `
@layer probe-luke-ui.recipes;
@layer probe-base, probe-luke-ui;
@layer probe-luke-ui.recipes { .probe-invalid { display: inline-flex; } }
@layer probe-base { .probe-invalid { display: block; } }
`;

	const element = mountProbe('probe-invalid');

	expect(getComputedStyle(element).display).toBe('block');
});

test('a later application layer named recipes or utilities does not join Luke UI layers', () => {
	const iconClass = iconBaseClassName(stylesheetCss);
	const element = mountProbe(iconClass);

	const appStyle = document.head.appendChild(document.createElement('style'));
	appStyle.dataset.layerOrderProbe = 'true';
	// Top-level layers created after `luke-ui` outrank all of it, including its utilities.
	appStyle.textContent = `@layer recipes { .${iconClass} { display: grid; } }`;

	expect(getComputedStyle(element).display).toBe('grid');
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

test('LoadingSkeleton recipes !important beats utilities-layer !important overrides', () => {
	const skeletonClass = loadingSkeletonClassName(stylesheetCss);

	const element = document.body.appendChild(document.createElement('div'));
	mounted.push(element);
	element.className = skeletonClass;
	element.innerHTML = '<span>child</span>';

	const utilityStyle = document.head.appendChild(document.createElement('style'));
	utilityStyle.dataset.layerOrderProbe = 'true';
	utilityStyle.textContent = `@layer luke-ui.utilities { .${skeletonClass}:not([data-skeleton-inline]) > * { background-color: red !important; } }`;

	expect(getComputedStyle(element.firstElementChild!).backgroundColor).not.toBe('rgb(255, 0, 0)');
});

test('LoadingSkeleton recipes !important beats !important from later layers and unlayered CSS', () => {
	const skeletonClass = loadingSkeletonClassName(stylesheetCss);

	const element = document.body.appendChild(document.createElement('div'));
	mounted.push(element);
	element.className = skeletonClass;
	element.innerHTML = '<span>child</span>';
	const child = element.firstElementChild!;

	const appLayerStyle = document.head.appendChild(document.createElement('style'));
	appLayerStyle.dataset.layerOrderProbe = 'true';
	appLayerStyle.textContent = `@layer components { .${skeletonClass} > * { background-color: red !important; } }`;
	expect(getComputedStyle(child).backgroundColor).not.toBe('rgb(255, 0, 0)');

	// Under `!important` the layer order reverses, and unlayered CSS ranks below every layer.
	const unlayeredStyle = document.head.appendChild(document.createElement('style'));
	unlayeredStyle.dataset.layerOrderProbe = 'true';
	unlayeredStyle.textContent = `.${skeletonClass} > * { background-color: rgb(0, 128, 0) !important; }`;
	expect(getComputedStyle(child).backgroundColor).not.toBe('rgb(0, 128, 0)');
});

test('the global stylesheet outranks a consumer base layer, and unlayered CSS outranks both', () => {
	expect(getComputedStyle(document.documentElement).containerType).toBe('inline-size');

	const baseStyle = document.head.appendChild(document.createElement('style'));
	baseStyle.dataset.layerOrderProbe = 'true';
	baseStyle.textContent = '@layer base { :root { container-type: normal; } }';
	expect(getComputedStyle(document.documentElement).containerType).toBe('inline-size');

	const unlayeredStyle = document.head.appendChild(document.createElement('style'));
	unlayeredStyle.dataset.layerOrderProbe = 'true';
	unlayeredStyle.textContent = ':root { container-type: normal; }';
	expect(getComputedStyle(document.documentElement).containerType).toBe('normal');
});

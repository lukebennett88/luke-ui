import '../../../dist/themes/tactile/stylesheet.css';
import { afterEach, expect, test } from 'vite-plus/test';
import stylesheetCss from '../../../dist/stylesheet.css?inline';

const mounted: Array<HTMLElement> = [];

afterEach(() => {
	for (const element of mounted) element.remove();
	mounted.length = 0;
	for (const style of document.querySelectorAll('style[data-layer-order-probe]')) style.remove();
});

function stylexFixtureClasses(stylesheet: string): { outlineClass: string; paddingClass: string } {
	const stylexSection = stylesheet.split('/* stylex */')[1] ?? '';
	const outlineClass = stylexSection.match(/\.([a-z0-9]+)\{outline-color:transparent\}/)?.[1];
	const paddingClass = stylexSection.match(
		/\.([a-z0-9]+)\{padding:var\(--luke-space-sp16\)\}/,
	)?.[1];
	if (outlineClass == null || paddingClass == null) {
		throw new Error('Expected StyleX fixture classes in the built stylesheet.');
	}
	return { outlineClass, paddingClass };
}

test('places StyleX priority layers before recipes in the built stylesheet cascade', () => {
	const { outlineClass } = stylexFixtureClasses(stylesheetCss);

	const style = document.head.appendChild(document.createElement('style'));
	style.dataset.layerOrderProbe = 'true';
	style.textContent = stylesheetCss;

	const element = document.body.appendChild(document.createElement('div'));
	mounted.push(element);
	element.className = outlineClass;

	const recipeStyle = document.head.appendChild(document.createElement('style'));
	recipeStyle.dataset.layerOrderProbe = 'true';
	recipeStyle.textContent = `@layer recipes { .${outlineClass} { padding-top: 10px; } }`;

	expect(getComputedStyle(element).paddingTop).toBe('10px');
});

test('utilities beat StyleX priority layers in the built stylesheet cascade', () => {
	const { paddingClass } = stylexFixtureClasses(stylesheetCss);

	const style = document.head.appendChild(document.createElement('style'));
	style.dataset.layerOrderProbe = 'true';
	style.textContent = stylesheetCss;

	const element = document.body.appendChild(document.createElement('div'));
	mounted.push(element);
	element.className = paddingClass;

	const utilityStyle = document.head.appendChild(document.createElement('style'));
	utilityStyle.dataset.layerOrderProbe = 'true';
	utilityStyle.textContent = `@layer utilities { .${paddingClass} { padding-top: 20px; } }`;

	expect(getComputedStyle(element).paddingTop).toBe('20px');
});

test('unlayered consumer CSS beats StyleX priority layers', () => {
	const { paddingClass } = stylexFixtureClasses(stylesheetCss);

	const style = document.head.appendChild(document.createElement('style'));
	style.dataset.layerOrderProbe = 'true';
	style.textContent = stylesheetCss;

	const element = document.body.appendChild(document.createElement('div'));
	mounted.push(element);
	element.className = paddingClass;

	const consumerStyle = document.head.appendChild(document.createElement('style'));
	consumerStyle.dataset.layerOrderProbe = 'true';
	consumerStyle.textContent = `.${paddingClass} { padding-top: 30px; }`;

	expect(getComputedStyle(element).paddingTop).toBe('30px');
});

test('reproduces the invalid early layer-declaration failure mode', () => {
	const style = document.head.appendChild(document.createElement('style'));
	style.dataset.layerOrderProbe = 'true';
	style.textContent = `
@layer reset;
@layer theme;
@layer recipes;
@layer structural;
@layer utilities;
@layer reset, theme, luke.sx.priority1, recipes, structural, utilities;
@layer recipes { .probe { padding-top: 10px; } }
@layer utilities { .probe { padding-top: 20px; } }
@layer luke.sx.priority1 { .probe { padding-top: 40px; } }
`;

	const element = document.body.appendChild(document.createElement('div'));
	mounted.push(element);
	element.className = 'probe';

	expect(getComputedStyle(element).paddingTop).toBe('40px');
});

function loadingSkeletonClassName(stylesheet: string): string {
	const match = stylesheet.match(/\.(_[a-z0-9]+)\[data-skeleton-inline\]/);
	if (match == null || match[1] == null) {
		throw new Error('Expected LoadingSkeleton class in the built stylesheet.');
	}
	return match[1];
}

test('LoadingSkeleton structural !important beats utilities-layer !important overrides', () => {
	const skeletonClass = loadingSkeletonClassName(stylesheetCss);

	const style = document.head.appendChild(document.createElement('style'));
	style.dataset.layerOrderProbe = 'true';
	style.textContent = stylesheetCss;

	const element = document.body.appendChild(document.createElement('div'));
	mounted.push(element);
	element.className = skeletonClass;
	element.innerHTML = '<span>child</span>';

	const utilityStyle = document.head.appendChild(document.createElement('style'));
	utilityStyle.dataset.layerOrderProbe = 'true';
	utilityStyle.textContent = `@layer utilities { .${skeletonClass}:not([data-skeleton-inline]) > * { background-color: red !important; } }`;

	expect(getComputedStyle(element.firstElementChild!).backgroundColor).not.toBe('rgb(255, 0, 0)');
});

test('authoritative layer order before any layer blocks preserves utilities over StyleX', () => {
	const style = document.head.appendChild(document.createElement('style'));
	style.dataset.layerOrderProbe = 'true';
	style.textContent = `
@layer reset, theme, "luke.sx.priority1", recipes, structural, utilities;
@layer recipes { .probe { padding-top: 10px; } }
@layer utilities { .probe { padding-top: 20px; } }
@layer "luke.sx.priority1" { .probe { padding-top: 40px; } }
`;

	const element = document.body.appendChild(document.createElement('div'));
	mounted.push(element);
	element.className = 'probe';

	expect(getComputedStyle(element).paddingTop).toBe('20px');
});

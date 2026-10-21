import '../stylesheet.css.js';
import { afterEach, beforeEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { mergeProps } from '../../shared/utils/merge-props.js';
import { breakpoints } from '../../theme/breakpoints.js';
import { fixtureThemeClassName } from '../test-utils/fixture-themes.js';
import { createSprinkles } from './create-sprinkles.js';

const mounted: Array<HTMLElement> = [];

beforeEach(() => {
	document.documentElement.classList.add(fixtureThemeClassName('tactile'));
});

afterEach(async () => {
	document.documentElement.classList.remove(fixtureThemeClassName('tactile'));
	for (const element of mounted) element.remove();
	mounted.length = 0;
	await page.viewport(1024, 800);
});

test('applies every retained breakpoint responsively', async () => {
	const element = mount(
		createSprinkles({
			padding: {
				initial: 'space.4',
				bp640: 'space.8',
				bp768: 'space.12',
				bp1024: 'space.16',
				bp1280: 'space.24',
				bp1536: 'space.32',
			},
		}),
	);

	const viewports = [
		{ width: 320, property: '--luke-space-4' },
		{ width: breakpoints.bp640, property: '--luke-space-8' },
		{ width: breakpoints.bp768, property: '--luke-space-12' },
		{ width: breakpoints.bp1024, property: '--luke-space-16' },
		{ width: breakpoints.bp1280, property: '--luke-space-24' },
		{ width: breakpoints.bp1536, property: '--luke-space-32' },
	] as const;

	for (const viewport of viewports) {
		// eslint-disable-next-line no-await-in-loop -- viewport changes must be observed in order
		await page.viewport(viewport.width, 800);
		const computedStyle = getComputedStyle(element);
		expect(computedStyle.padding).toBe(resolvedCustomProperty(element, viewport.property));
	}
});

test('resolves against a nearer explicit container instead of the root', async () => {
	await page.viewport(1024, 800);

	const wrapper = document.body.appendChild(document.createElement('div'));
	mounted.push(wrapper);
	wrapper.style.containerType = 'inline-size';
	wrapper.style.inlineSize = `${breakpoints.bp640 - 1}px`;

	const generated = createSprinkles({ padding: { initial: 'space.4', bp640: 'space.8' } });
	const element = mount(generated, wrapper);

	const computedStyle = getComputedStyle(element);
	expect(computedStyle.padding).toBe(resolvedCustomProperty(element, '--luke-space-4'));
});

test('resolves against the root content box, not the viewport width', async () => {
	// A scrollbar takes its width out of the root's content box, so the root container's inline
	// size measures narrower than the viewport. Root padding reproduces that narrowing without
	// depending on the headless browser rendering a scrollbar.
	await page.viewport(breakpoints.bp640, 800);
	const rootStyle = document.head.appendChild(document.createElement('style'));
	rootStyle.textContent = ':root { padding-inline-end: 17px; }';

	const generated = createSprinkles({ padding: { initial: 'space.4', bp640: 'space.8' } });
	const element = mount(generated);

	const computedStyle = getComputedStyle(element);
	expect(computedStyle.padding).toBe(resolvedCustomProperty(element, '--luke-space-4'));
	rootStyle.remove();
});

for (const emptyValue of [null, undefined, '']) {
	test(`keeps the earlier breakpoint value where a breakpoint is ${JSON.stringify(emptyValue)}`, async () => {
		await page.viewport(breakpoints.bp640, 800);
		const element = mount(
			createSprinkles({ maxInlineSize: { initial: '10px', bp640: emptyValue } }),
		);

		expect(getComputedStyle(element).maxInlineSize).toBe('10px');
	});
}

test("does not take an ancestor's value where a breakpoint is null", async () => {
	await page.viewport(breakpoints.bp640, 800);
	const parent = mount(createSprinkles({ maxInlineSize: { initial: '50px', bp640: '400px' } }));
	const element = mount(
		createSprinkles({ maxInlineSize: { initial: '10px', bp640: null } }),
		parent,
	);

	expect(getComputedStyle(element).maxInlineSize).toBe('10px');
});

test('returns class and style output that merges with consumer props', () => {
	// `display` is a static class. `inlineSize` is a dynamic property, so Sprinkles emits inline
	// style for it. A consumer style-only fixture would still pass if `mergeProps` dropped the
	// generated `style`.
	const generated = createSprinkles({
		display: 'grid',
		inlineSize: '400px',
	});
	const props = mergeProps(generated, {
		className: 'consumer-class',
		style: { backgroundColor: 'rgb(1, 2, 3)' },
	});
	const element = mount(props);

	expect(element.classList).toContain('consumer-class');
	expect(getComputedStyle(element).display).toBe('grid');
	expect(getComputedStyle(element).inlineSize).toBe('400px');
	expect(getComputedStyle(element).backgroundColor).toBe('rgb(1, 2, 3)');
});

test('columnGap overrides gap while rowGap keeps the shorthand', () => {
	const element = mount(createSprinkles({ gap: 'space.8', columnGap: 'space.4' }));
	const computedStyle = getComputedStyle(element);

	expect(computedStyle.columnGap).toBe(resolvedCustomProperty(element, '--luke-space-4'));
	expect(computedStyle.rowGap).toBe(resolvedCustomProperty(element, '--luke-space-8'));
});

test('marginInlineStart overrides margin through the inline shorthand', () => {
	const element = mount(
		createSprinkles({
			margin: 'space.16',
			marginInline: 'space.8',
			marginInlineStart: 'space.4',
		}),
	);
	const computedStyle = getComputedStyle(element);

	expect(computedStyle.marginInlineStart).toBe(resolvedCustomProperty(element, '--luke-space-4'));
	expect(computedStyle.marginInlineEnd).toBe(resolvedCustomProperty(element, '--luke-space-8'));
	expect(computedStyle.marginBlockStart).toBe(resolvedCustomProperty(element, '--luke-space-16'));
});

test('gridColumnStart overrides gridArea', () => {
	const computedStyle = getComputedStyle(
		mount(createSprinkles({ gridArea: '1 / 2 / 3 / 4', gridColumnStart: '5' })),
	);

	expect(computedStyle.gridColumnStart).toBe('5');
	expect(computedStyle.gridColumnEnd).toBe('4');
	expect(computedStyle.gridRowStart).toBe('1');
	expect(computedStyle.gridRowEnd).toBe('3');
});

test('a later responsive gap overrides a base columnGap on both axes', async () => {
	const element = mount(
		createSprinkles({
			gap: { initial: 'space.8', bp768: 'space.24' },
			columnGap: 'space.4',
		}),
	);

	await page.viewport(320, 800);
	expect(getComputedStyle(element).rowGap).toBe(resolvedCustomProperty(element, '--luke-space-8'));
	expect(getComputedStyle(element).columnGap).toBe(
		resolvedCustomProperty(element, '--luke-space-4'),
	);

	await page.viewport(breakpoints.bp768, 800);
	expect(getComputedStyle(element).rowGap).toBe(resolvedCustomProperty(element, '--luke-space-24'));
	expect(getComputedStyle(element).columnGap).toBe(
		resolvedCustomProperty(element, '--luke-space-24'),
	);
});

test('columnGap overrides gap when both are set at the same breakpoint', async () => {
	await page.viewport(breakpoints.bp768, 800);
	const element = mount(
		createSprinkles({
			gap: { bp768: 'space.24' },
			columnGap: { bp768: 'space.4' },
		}),
	);
	const computedStyle = getComputedStyle(element);

	expect(computedStyle.rowGap).toBe(resolvedCustomProperty(element, '--luke-space-24'));
	expect(computedStyle.columnGap).toBe(resolvedCustomProperty(element, '--luke-space-4'));
});

/**
 * Resolves a custom-property length through used-value computation. `getPropertyValue` returns the
 * authored token (`0.25rem`); computed padding is always in CSS pixels.
 */
function resolvedCustomProperty(host: HTMLElement, property: string): string {
	const probe = host.appendChild(document.createElement('div'));
	probe.style.padding = `var(${property})`;
	const resolved = getComputedStyle(probe).padding;
	probe.remove();
	return resolved;
}

function mount(
	props: { className?: string; style?: Record<string, unknown> },
	parent: HTMLElement = document.body,
): HTMLElement {
	const element = parent.appendChild(document.createElement('div'));
	mounted.push(element);
	element.className = props.className ?? '';
	Object.assign(element.style, props.style);
	for (const [property, value] of Object.entries(props.style ?? {})) {
		if (property.startsWith('--')) element.style.setProperty(property, String(value));
	}
	return element;
}

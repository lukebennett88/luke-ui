import '../../dist/themes/tactile/stylesheet.css';
import '../stylesheet.css.js';
import { afterEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { breakpoints } from '../theme/breakpoints.js';
import { themeClassName as tactileThemeClassName } from '../themes/tactile/index.js';
import { mergeProps } from '../utils/index.js';
import { createSprinkles } from './utilities.css.js';

const mounted: Array<HTMLElement> = [];

afterEach(async () => {
	for (const element of mounted) element.remove();
	mounted.length = 0;
	await page.viewport(1024, 800);
});

test('applies every retained breakpoint responsively', async () => {
	const element = mount(
		createSprinkles({
			padding: {
				initial: '100',
				large: '400',
				medium: '300',
				small: '200',
				xlarge: '600',
				xxlarge: '800',
			},
		}),
	);

	const viewports = [
		{ width: 320, property: '--luke-space-100' },
		{ width: breakpoints.small, property: '--luke-space-200' },
		{ width: breakpoints.medium, property: '--luke-space-300' },
		{ width: breakpoints.large, property: '--luke-space-400' },
		{ width: breakpoints.xlarge, property: '--luke-space-600' },
		{ width: breakpoints.xxlarge, property: '--luke-space-800' },
	] as const;

	for (const viewport of viewports) {
		// eslint-disable-next-line no-await-in-loop -- viewport changes must be observed in order
		await page.viewport(viewport.width, 800);
		const computedStyle = getComputedStyle(element);
		expect(computedStyle.padding).toBe(computedStyle.getPropertyValue(viewport.property).trim());
	}
});

test('resolves against a nearer explicit container instead of the viewport', async () => {
	await page.viewport(1024, 800);

	const wrapper = document.body.appendChild(document.createElement('div'));
	mounted.push(wrapper);
	wrapper.style.containerType = 'inline-size';
	wrapper.style.inlineSize = `${breakpoints.small - 1}px`;

	const generated = createSprinkles({ padding: { initial: '100', small: '200' } });
	const element = mount(generated, wrapper);

	const computedStyle = getComputedStyle(element);
	expect(computedStyle.padding).toBe(computedStyle.getPropertyValue('--luke-space-100').trim());
});

test('resolves against the root content box, not the viewport width', async () => {
	// A scrollbar takes its width out of the root's content box, so the root container
	// measures narrower than the viewport. Root padding reproduces that narrowing without
	// depending on the headless browser rendering a scrollbar.
	await page.viewport(breakpoints.small, 800);
	const rootStyle = document.head.appendChild(document.createElement('style'));
	rootStyle.textContent = ':root { padding-inline-end: 17px; }';

	const generated = createSprinkles({ padding: { initial: '100', small: '200' } });
	const element = mount(generated);

	const computedStyle = getComputedStyle(element);
	expect(computedStyle.padding).toBe(computedStyle.getPropertyValue('--luke-space-100').trim());
	rootStyle.remove();
});

test('returns class and style output that merges with consumer props', () => {
	const generated = createSprinkles({
		display: 'grid',
		inlineSize: 'calc(100% - 2rem)',
		padding: '400',
	});
	const props = mergeProps(generated, {
		className: 'consumer-class',
		style: { backgroundColor: 'rgb(1, 2, 3)' },
	});
	const element = mount(props);

	expect(element.classList).toContain('consumer-class');
	expect(Object.keys(generated.style)).not.toHaveLength(0);
	expect(getComputedStyle(element).display).toBe('grid');
	expect(getComputedStyle(element).inlineSize).toBe(`${document.body.clientWidth - 32}px`);
	expect(getComputedStyle(element).backgroundColor).toBe('rgb(1, 2, 3)');
});

function mount(
	props: { className?: string; style?: Record<string, unknown> },
	parent: HTMLElement = document.body,
): HTMLElement {
	const element = parent.appendChild(document.createElement('div'));
	mounted.push(element);
	element.className = `${tactileThemeClassName} ${props.className ?? ''}`;
	Object.assign(element.style, props.style);
	for (const [property, value] of Object.entries(props.style ?? {})) {
		if (property.startsWith('--')) element.style.setProperty(property, String(value));
	}
	return element;
}

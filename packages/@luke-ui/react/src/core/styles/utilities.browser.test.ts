import '../../../dist/themes/tactile/stylesheet.css';
import '../stylesheet.css.js';
import { afterEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { mergeStyleProps } from '../../shared/utils/utils.js';
import { breakpoints } from '../../theme/breakpoints.js';
import { themeClassName as tactileThemeClassName } from '../../theme/bundles/tactile/index.js';
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
				initial: 'sp4',
				bp640: 'sp8',
				bp768: 'sp12',
				bp1024: 'sp16',
				bp1280: 'sp24',
				bp1536: 'sp32',
			},
		}),
	);

	const viewports = [
		{ width: 320, property: '--luke-space-sp4' },
		{ width: breakpoints.bp640, property: '--luke-space-sp8' },
		{ width: breakpoints.bp768, property: '--luke-space-sp12' },
		{ width: breakpoints.bp1024, property: '--luke-space-sp16' },
		{ width: breakpoints.bp1280, property: '--luke-space-sp24' },
		{ width: breakpoints.bp1536, property: '--luke-space-sp32' },
	] as const;

	for (const viewport of viewports) {
		// eslint-disable-next-line no-await-in-loop -- viewport changes must be observed in order
		await page.viewport(viewport.width, 800);
		const computedStyle = getComputedStyle(element);
		expect(computedStyle.padding).toBe(computedStyle.getPropertyValue(viewport.property).trim());
	}
});

test('resolves against a nearer explicit container instead of the root', async () => {
	await page.viewport(1024, 800);

	const wrapper = document.body.appendChild(document.createElement('div'));
	mounted.push(wrapper);
	wrapper.style.containerType = 'inline-size';
	wrapper.style.inlineSize = `${breakpoints.bp640 - 1}px`;

	const generated = createSprinkles({ padding: { initial: 'sp4', bp640: 'sp8' } });
	const element = mount(generated, wrapper);

	const computedStyle = getComputedStyle(element);
	expect(computedStyle.padding).toBe(computedStyle.getPropertyValue('--luke-space-sp4').trim());
});

test('resolves against the root content box, not the viewport width', async () => {
	// A scrollbar takes its width out of the root's content box, so the root container's inline
	// size measures narrower than the viewport. Root padding reproduces that narrowing without
	// depending on the headless browser rendering a scrollbar.
	await page.viewport(breakpoints.bp640, 800);
	const rootStyle = document.head.appendChild(document.createElement('style'));
	rootStyle.textContent = ':root { padding-inline-end: 17px; }';

	const generated = createSprinkles({ padding: { initial: 'sp4', bp640: 'sp8' } });
	const element = mount(generated);

	const computedStyle = getComputedStyle(element);
	expect(computedStyle.padding).toBe(computedStyle.getPropertyValue('--luke-space-sp4').trim());
	rootStyle.remove();
});

test('returns class and style output that merges with consumer props', () => {
	// `display` is a static class. `inlineSize` is a dynamic property, so Sprinkles emits inline
	// style for it. A consumer style-only fixture would still pass if `mergeStyleProps` dropped the
	// generated `style`.
	const generated = createSprinkles({
		display: 'grid',
		inlineSize: '400px',
	});
	const props = mergeStyleProps(generated, {
		className: 'consumer-class',
		style: { backgroundColor: 'rgb(1, 2, 3)' },
	});
	const element = mount(props);

	expect(element.classList).toContain('consumer-class');
	expect(getComputedStyle(element).display).toBe('grid');
	expect(getComputedStyle(element).inlineSize).toBe('400px');
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

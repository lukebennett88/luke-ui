import '../../dist/themes/tactile/stylesheet.css';
import '../stylesheet.css.js';
import { afterEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
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

	const breakpoints = [
		{ name: 'initial', width: 320 },
		{ name: 'small', width: 640 },
		{ name: 'medium', width: 768 },
		{ name: 'large', width: 1024 },
		{ name: 'xlarge', width: 1280 },
		{ name: 'xxlarge', width: 1536 },
	] as const;

	let previousPadding: string | undefined;
	for (const breakpoint of breakpoints) {
		// eslint-disable-next-line no-await-in-loop -- viewport changes must be observed in order
		await page.viewport(breakpoint.width, 800);
		const padding = getComputedStyle(element).padding;
		if (previousPadding !== undefined) {
			expect(padding, `${breakpoint.name} should resolve a different space step`).not.toBe(
				previousPadding,
			);
		}
		previousPadding = padding;
	}
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

function mount(props: { className?: string; style?: Record<string, unknown> }): HTMLElement {
	const element = document.body.appendChild(document.createElement('div'));
	mounted.push(element);
	element.className = `${tactileThemeClassName} ${props.className ?? ''}`;
	Object.assign(element.style, props.style);
	for (const [property, value] of Object.entries(props.style ?? {})) {
		if (property.startsWith('--')) element.style.setProperty(property, String(value));
	}
	return element;
}

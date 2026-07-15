import '../../dist/themes/machined-edge.css';
import '../stylesheet.css.js';
import { afterEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { machinedEdgeThemeClassName } from '../themes/index.js';
import { mergeProps } from '../utils/index.js';
import { createSprinkles } from './index.js';

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
				large: '400',
				medium: '300',
				small: '200',
				xlarge: '600',
				xsmall: '100',
				xxlarge: '800',
			},
		}),
	);

	const breakpoints = [
		{ expected: '4px', name: 'xsmall', width: 320 },
		{ expected: '8px', name: 'small', width: 640 },
		{ expected: '12px', name: 'medium', width: 768 },
		{ expected: '16px', name: 'large', width: 1024 },
		{ expected: '24px', name: 'xlarge', width: 1280 },
		{ expected: '32px', name: 'xxlarge', width: 1536 },
	] as const;

	for (const breakpoint of breakpoints) {
		// eslint-disable-next-line no-await-in-loop -- viewport changes must be observed in order
		await page.viewport(breakpoint.width, 800);
		expect(getComputedStyle(element).padding).toBe(breakpoint.expected);
	}
});

test('resolves every semantic space step including zero', () => {
	const spaces = [
		{ expected: '0px', step: '0' },
		{ expected: '4px', step: '100' },
		{ expected: '8px', step: '200' },
		{ expected: '12px', step: '300' },
		{ expected: '16px', step: '400' },
		{ expected: '24px', step: '600' },
		{ expected: '32px', step: '800' },
		{ expected: '40px', step: '1000' },
		{ expected: '48px', step: '1200' },
		{ expected: '64px', step: '1600' },
	] as const;

	for (const space of spaces) {
		const element = mount(createSprinkles({ padding: space.step }));
		expect(getComputedStyle(element).padding).toBe(space.expected);
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
	expect(getComputedStyle(element).padding).toBe('16px');
	expect(getComputedStyle(element).backgroundColor).toBe('rgb(1, 2, 3)');
});

function mount(props: { className?: string; style?: Record<string, unknown> }): HTMLElement {
	const element = document.body.appendChild(document.createElement('div'));
	mounted.push(element);
	element.className = `${machinedEdgeThemeClassName} ${props.className ?? ''}`;
	Object.assign(element.style, props.style);
	for (const [property, value] of Object.entries(props.style ?? {})) {
		if (property.startsWith('--')) element.style.setProperty(property, String(value));
	}
	return element;
}

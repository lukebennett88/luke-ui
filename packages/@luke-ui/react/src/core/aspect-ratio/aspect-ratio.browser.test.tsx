import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { AspectRatio } from './aspect-ratio.js';

testConformance({
	path: 'aspect-ratio',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected AspectRatio element.');
		return target;
	},
	render: (props = {}) => render(<AspectRatio {...props}>Content</AspectRatio>),
});

test('prefers the requested ratio when content is smaller than the frame', () => {
	const { locator } = render(
		<AspectRatio data-testid="ratio" inlineSize="16rem" ratio="16 / 9">
			<div data-testid="child" style={{ blockSize: '1rem', inlineSize: '1rem' }} />
		</AspectRatio>,
	);
	const element = locator.getByTestId('ratio').element();
	const child = locator.getByTestId('child').element();
	if (!(element instanceof HTMLElement) || !(child instanceof HTMLElement)) {
		throw new Error('Expected AspectRatio elements.');
	}

	expect(getComputedStyle(element).aspectRatio).toBe('16 / 9');
	expect(element.getBoundingClientRect().width).toBe(256);
	expect(element.getBoundingClientRect().height).toBe(144);
	expect(child.getBoundingClientRect().width).toBe(16);
	expect(child.getBoundingClientRect().height).toBe(16);
});

test('lets an oversized child keep its dimensions and grow the frame', () => {
	const { locator } = render(
		<AspectRatio data-testid="ratio" inlineSize="10rem" ratio="16 / 9">
			<div data-testid="child" style={{ blockSize: '20rem', inlineSize: '8rem' }} />
		</AspectRatio>,
	);
	const element = locator.getByTestId('ratio').element();
	const child = locator.getByTestId('child').element();
	if (!(element instanceof HTMLElement) || !(child instanceof HTMLElement)) {
		throw new Error('Expected AspectRatio elements.');
	}

	expect(child.getBoundingClientRect().width).toBe(128);
	expect(child.getBoundingClientRect().height).toBe(320);
	expect(element.getBoundingClientRect().height).toBeGreaterThanOrEqual(320);
});

test('leaves interactive children operable', async () => {
	let pressed = false;
	const { locator, user } = render(
		<AspectRatio ratio="4 / 3">
			<button onClick={() => (pressed = true)} type="button">
				Play
			</button>
		</AspectRatio>,
	);
	await user.click(locator.getByRole('button', { name: 'Play' }));

	expect(pressed).toBe(true);
});

test('applies root layout props and ignores unsupported Box utilities from an object spread', () => {
	const props = {
		borderStyle: 'solid',
		borderWidth: 'thick',
		inlineSize: '10rem',
		ratio: '16 / 9',
	} as const;
	const { locator } = render(
		<div data-testid="parent" style={{ inlineSize: '20rem' }}>
			<AspectRatio {...props} data-testid="ratio" />
		</div>,
	);
	const parent = locator.getByTestId('parent').element();
	const element = locator.getByTestId('ratio').element();
	if (!(parent instanceof HTMLElement) || !(element instanceof HTMLElement)) {
		throw new Error('Expected AspectRatio elements.');
	}

	expect(element.getBoundingClientRect().width).toBe(160);
	expect(element.getBoundingClientRect().width).toBeLessThan(parent.getBoundingClientRect().width);
	expect(element.offsetWidth).toBe(element.clientWidth);
});

test('forwards refs and supports caller-owned elements', () => {
	const ref = createRef<HTMLElement>();
	const { locator } = render(
		<AspectRatio
			ref={ref}
			ratio="21 / 9"
			render={(resolvedProps) => <figure {...resolvedProps} data-testid="custom-ratio" />}
		/>,
	);
	const element = locator.getByTestId('custom-ratio').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected custom AspectRatio element.');

	expect(ref.current).toBe(element);
	expect(getComputedStyle(element).aspectRatio).toBe('21 / 9');
});

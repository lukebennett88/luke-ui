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

test('uses the default ratio and frames content on a grid', () => {
	const { locator } = render(<AspectRatio data-testid="ratio" elementType="span" />);
	const element = locator.getByTestId('ratio').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected AspectRatio element.');

	expect(getComputedStyle(element).aspectRatio).toBe('1 / 1');
	expect(getComputedStyle(element).display).toBe('grid');
});

test('sizes a child with no size of its own to the ratio box', () => {
	const { locator } = render(
		<AspectRatio data-testid="ratio" inlineSize="16rem" ratio="16 / 9">
			<div data-testid="fill" />
		</AspectRatio>,
	);
	const element = locator.getByTestId('ratio').element();
	const fill = locator.getByTestId('fill').element();
	if (!(element instanceof HTMLElement) || !(fill instanceof HTMLElement)) {
		throw new Error('Expected AspectRatio elements.');
	}

	expect(element.getBoundingClientRect().height).toBe(144);
	expect(fill.getBoundingClientRect().width).toBe(element.getBoundingClientRect().width);
	expect(fill.getBoundingClientRect().height).toBe(element.getBoundingClientRect().height);
});

test('sizes an iframe to the ratio box without caller fill styles', () => {
	const { locator } = render(
		<AspectRatio data-testid="ratio" inlineSize="16rem" ratio="16 / 9">
			<iframe data-testid="embed" src="about:blank" title="Blank embed" />
		</AspectRatio>,
	);
	const element = locator.getByTestId('ratio').element();
	const embed = locator.getByTestId('embed').element();
	if (!(element instanceof HTMLElement) || !(embed instanceof HTMLIFrameElement)) {
		throw new Error('Expected AspectRatio embed.');
	}

	expect(embed.getBoundingClientRect().width).toBe(element.getBoundingClientRect().width);
	expect(embed.getBoundingClientRect().height).toBe(element.getBoundingClientRect().height);
});

test('sizes a media child down when the frame is narrower than its intrinsic size', () => {
	const { locator } = render(
		<AspectRatio inlineSize="160px" ratio="4 / 3">
			<img
				alt="Ocean"
				height="180"
				src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
				width="240"
			/>
		</AspectRatio>,
	);
	const image = locator.getByRole('img', { name: 'Ocean' }).element();
	if (!(image instanceof HTMLImageElement)) throw new Error('Expected media element.');

	expect(image.getBoundingClientRect().width).toBe(160);
	expect(image.getBoundingClientRect().height).toBe(120);
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

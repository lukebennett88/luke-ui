import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { AspectRatio } from './aspect-ratio.js';

const ratios = [
	{ height: 256, ratio: '1 / 1' },
	{ height: 192, ratio: '4 / 3' },
	{ height: 256 * (2 / 3), ratio: '3 / 2' },
	{ height: 144, ratio: '16 / 9' },
	{ height: 256 * (9 / 21), ratio: '21 / 9' },
] as const;

const blankPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

testConformance({
	path: 'aspect-ratio',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected AspectRatio element.');
		return target;
	},
	render: (props = {}) => render(<AspectRatio {...props}>Content</AspectRatio>),
});

test('defaults to a 1 / 1 frame', () => {
	const { locator } = render(<AspectRatio data-testid="ratio" inlineSize="16rem" />);
	const element = locator.getByTestId('ratio').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected AspectRatio element.');

	expect(getComputedStyle(element).aspectRatio).toBe('1 / 1');
	expect(getComputedStyle(element).display).toBe('grid');
	expect(element.getBoundingClientRect().width).toBe(256);
	expect(element.getBoundingClientRect().height).toBe(256);
});

for (const { height, ratio } of ratios) {
	test(`locks the frame to ${ratio}`, () => {
		const { locator } = render(
			<AspectRatio data-testid="ratio" inlineSize="16rem" ratio={ratio} />,
		);
		const element = locator.getByTestId('ratio').element();
		if (!(element instanceof HTMLElement)) throw new Error('Expected AspectRatio element.');

		expect(getComputedStyle(element).aspectRatio).toBe(ratio);
		expect(element.getBoundingClientRect().width).toBe(256);
		expect(element.getBoundingClientRect().height).toBeCloseTo(height, 5);
	});
}
test('sizes a media child to fill the frame without caller fill styles', () => {
	const { locator } = render(
		<AspectRatio data-testid="ratio" inlineSize="16rem" ratio="16 / 9">
			<img alt="Ocean" data-testid="media" height="180" src={blankPixel} width="240" />
		</AspectRatio>,
	);
	const element = locator.getByTestId('ratio').element();
	const media = locator.getByTestId('media').element();
	if (!(element instanceof HTMLElement) || !(media instanceof HTMLImageElement)) {
		throw new Error('Expected AspectRatio media.');
	}

	expect(media.getBoundingClientRect().width).toBe(element.getBoundingClientRect().width);
	expect(media.getBoundingClientRect().height).toBe(element.getBoundingClientRect().height);
	expect(media.getBoundingClientRect().width).toBe(256);
	expect(media.getBoundingClientRect().height).toBe(144);
});

test('defaults objectFit to cover on the media child', () => {
	const { locator } = render(
		<AspectRatio inlineSize="16rem" ratio="16 / 9">
			<img alt="Ocean" data-testid="media" height="180" src={blankPixel} width="240" />
		</AspectRatio>,
	);
	const media = locator.getByTestId('media').element();
	if (!(media instanceof HTMLImageElement)) throw new Error('Expected media element.');

	expect(getComputedStyle(media).objectFit).toBe('cover');
});

test('applies an explicit objectFit value to the media child', () => {
	const { locator } = render(
		<AspectRatio inlineSize="16rem" objectFit="contain" ratio="16 / 9">
			<img alt="Ocean" data-testid="media" height="180" src={blankPixel} width="240" />
		</AspectRatio>,
	);
	const media = locator.getByTestId('media').element();
	if (!(media instanceof HTMLImageElement)) throw new Error('Expected media element.');

	expect(getComputedStyle(media).objectFit).toBe('contain');
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

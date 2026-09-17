import { expect, test } from 'vite-plus/test';
import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { AspectRatio } from './aspect-ratio.js';

const ratios = ['1 / 1', '4 / 3', '3 / 2', '16 / 9', '21 / 9'] as const;

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

test('defaults to a square frame when ratio is omitted', () => {
	const { locator } = render(<AspectRatio data-testid="ratio" inlineSize="16rem" />);
	const element = locator.getByTestId('ratio').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected AspectRatio element.');
	const { height, width } = element.getBoundingClientRect();

	expect(width).toBe(256);
	expect(height / width).toBeCloseTo(1, 2);
});

for (const ratio of ratios) {
	test(`locks the frame to ${ratio}`, () => {
		const { locator } = render(
			<AspectRatio data-testid="ratio" inlineSize="16rem" ratio={ratio} />,
		);
		const element = locator.getByTestId('ratio').element();
		if (!(element instanceof HTMLElement)) throw new Error('Expected AspectRatio element.');
		const { height, width } = element.getBoundingClientRect();
		const [inlinePart, blockPart] = ratio.split(' / ');
		const inline = Number(inlinePart);
		const block = Number(blockPart);

		expect(height / width).toBeCloseTo(block / inline, 2);
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

test('applies the chosen ratio to a caller-owned root', () => {
	const { locator } = render(
		<AspectRatio
			inlineSize="16rem"
			ratio="21 / 9"
			render={(resolvedProps) => <figure {...resolvedProps} data-testid="custom-ratio" />}
		/>,
	);
	const element = locator.getByTestId('custom-ratio').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected custom AspectRatio element.');
	const { height, width } = element.getBoundingClientRect();

	expect(height / width).toBeCloseTo(9 / 21, 2);
});

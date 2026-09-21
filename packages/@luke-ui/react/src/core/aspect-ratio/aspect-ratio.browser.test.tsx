import { AspectRatio } from '@luke-ui/react/aspect-ratio';
import { createRef } from 'react';
import { test, expect } from 'vite-plus/test';
import { vars } from '../../theme/index.js';
import { expectForwardsDomProps, expectHtmlElement } from '../test-utils/forwarding.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance } from '../test-utils/visual.js';

test('AspectRatio forwards className, data attributes, id, and ref to its element', () => {
	const ref = createRef<HTMLElement>();
	const { container } = render(
		<AspectRatio className="forwarded-class" data-forwarded="true" id="forwarded-id" ref={ref}>
			Content
		</AspectRatio>,
	);
	const target = expectHtmlElement(container.firstElementChild, 'Expected AspectRatio element.');

	expectForwardsDomProps(target, ref);
});

const ratios = ['1 / 1', '4 / 3', '3 / 2', '16 / 9', '21 / 9'] as const;

const blankPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

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
const objectFits = ['cover', 'contain', 'fill', 'none', 'scale-down'] as const;

/** Wide asymmetric SVG so cover, contain, and fill are visually distinct. */
const mediaSrc = `data:image/svg+xml,${encodeURIComponent(
	`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
		<rect width="200" height="200" fill="#1d4ed8"/>
		<rect x="200" width="200" height="200" fill="#f59e0b"/>
		<circle cx="100" cy="100" r="48" fill="#ffffff"/>
		<rect x="260" y="60" width="80" height="80" fill="#111827"/>
	</svg>`,
)}`;

test('media frame ratios and objectFit values', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator: scene } = render(
			<div style={{ display: 'grid', gap: vars.space.sp16 }}>
				{ratios.map((ratio) => (
					<AspectRatio key={ratio} inlineSize="18rem" ratio={ratio}>
						<img alt={`Ratio ${ratio}`} src={mediaSrc} />
					</AspectRatio>
				))}
				{objectFits.map((objectFit) => (
					<AspectRatio key={objectFit} inlineSize="18rem" objectFit={objectFit} ratio="16 / 9">
						<img alt={`objectFit ${objectFit}`} src={mediaSrc} />
					</AspectRatio>
				))}
			</div>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'aspect-ratio/media-frame', appearance);
	}
});

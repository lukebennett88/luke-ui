import { AspectRatio } from '@luke-ui/react/aspect-ratio';
import { vars } from '@luke-ui/react/theme';
import { expect, test } from 'vite-plus/test';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance } from '../test-utils/visual.js';

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

test('applies the chosen ratio to a caller-owned root', () => {
	const { locator } = render(
		<AspectRatio
			inlineSize="16rem"
			ratio="21 / 9"
			renderRoot={(domProps) => <figure {...domProps} data-testid="custom-ratio" />}
		/>,
	);
	const element = locator.getByTestId('custom-ratio').element();
	if (!(element instanceof HTMLElement)) throw new Error('Expected custom AspectRatio element.');
	const { height, width } = element.getBoundingClientRect();

	expect(height / width).toBeCloseTo(9 / 21, 2);
});
const objectFits = ['cover', 'contain', 'fill', 'none', 'scale-down'] as const;

// Asymmetry distinguishes object-fit values.
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
					<AspectRatio inlineSize="18rem" key={ratio} ratio={ratio}>
						<img alt={`Ratio ${ratio}`} src={mediaSrc} />
					</AspectRatio>
				))}
				{objectFits.map((objectFit) => (
					<AspectRatio inlineSize="18rem" key={objectFit} objectFit={objectFit} ratio="16 / 9">
						<img alt={`objectFit ${objectFit}`} src={mediaSrc} />
					</AspectRatio>
				))}
			</div>,
			{ appearance },
		);
		await captureVisualAppearance(scene, 'aspect-ratio/media-frame', appearance);
	}
});

import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { SelectField, SelectItem } from '@luke-ui/react/select-field';
import { SwitchField } from '@luke-ui/react/switch-field';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { vars } from '@luke-ui/react/theme';
import type { ReactNode } from 'react';
import { afterEach, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { renderedPixels } from '../test-utils/autofill.js';
import { emulateForcedColors } from '../test-utils/emulate-media.js';
import type { VisualAppearance } from '../test-utils/render.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { resolvedColor } from '../test-utils/surface-colors.js';
import { parkPointer } from '../test-utils/visual.js';

// `ThemeInput.color.focus` is gated at 3:1 against these nine backgrounds, so each is a place a
// control can sit when it takes focus.
const backgrounds = [
	'surface.base',
	'surface.subdued',
	'surface.raised',
	'neutral.subtle',
	'accent.subtle',
	'info.subtle',
	'success.subtle',
	'warning.subtle',
	'danger.subtle',
] as const;

// Bundled themes plus the two fixtures that stress the gates: the chromatic brief and a pale
// accent beside a custom raised surface.
const appearances: Array<VisualAppearance> = [
	...visualAppearances,
	{ mode: 'light', theme: 'chromatic' },
	{ mode: 'dark', theme: 'chromatic' },
	{ mode: 'light', theme: 'contrastEdge' },
	{ mode: 'dark', theme: 'contrastEdge' },
];

const controls: Array<{ name: string; control: ReactNode }> = [
	{ name: 'Button', control: <Button>Save</Button> },
	{ name: 'TextInputField', control: <TextInputField label="Name" /> },
	{ name: 'CheckboxField', control: <CheckboxField label="Subscribe" /> },
	{ name: 'SwitchField', control: <SwitchField label="Notifications" /> },
	{
		name: 'SelectField',
		control: (
			<SelectField label="Theme">
				<SelectItem id="light">Light</SelectItem>
			</SelectField>
		),
	},
];

const FOCUS_RATIO = 3;
// Rounding the painted ring to 8-bit sRGB moves it by a level or two.
const PAINT_TOLERANCE = 4;

type Rgb = [number, number, number];

afterEach(async () => {
	await emulateForcedColors('none');
	await parkPointer();
});

function tilesFor(control: ReactNode) {
	return (
		<Box display="grid" gap="space.16">
			{backgrounds.map((background) => (
				<Box
					aria-label={background}
					backgroundColor={background}
					key={background}
					padding="space.16"
					role="group"
				>
					{control}
				</Box>
			))}
		</Box>
	);
}

/** The elements inside `root` that paint an outline a user can see. A hidden input's is clipped. */
function visibleRings(root: Element): Array<HTMLElement> {
	return [...root.querySelectorAll<HTMLElement>('*')].filter((element) => {
		const style = getComputedStyle(element);
		if (style.outlineStyle === 'none' || style.outlineWidth === '0px') return false;
		for (let node: Element | null = element; node !== null; node = node.parentElement) {
			const { clip, clipPath } = getComputedStyle(node);
			if (clip !== 'auto' || clipPath !== 'none') return false;
		}
		return true;
	});
}

function singleRing(tile: Element): HTMLElement {
	const rings = visibleRings(tile);
	expect(rings, 'visible rings in the focused tile').toHaveLength(1);
	return rings[0]!;
}

/** The sRGB bytes the browser paints for a CSS colour. */
function paintedColor(color: string): Rgb {
	const context = new OffscreenCanvas(1, 1).getContext('2d');
	if (context === null) throw new Error('Expected a 2D canvas context.');
	context.fillStyle = color;
	context.fillRect(0, 0, 1, 1);
	const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
	return [red, green, blue];
}

function luminance(rgb: Rgb): number {
	const [red = 0, green = 0, blue = 0] = rgb.map((byte) => {
		const channel = byte / 255;
		return channel <= 0.040_45 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first: Rgb, second: Rgb): number {
	const [lighter, darker] = [luminance(first), luminance(second)].toSorted((a, b) => b - a);
	return (lighter! + 0.05) / (darker! + 0.05);
}

/**
 * The pixels on each side of the ring at the middle of every edge of `ringElement`'s border box:
 * the ring itself, the gap between the ring and the control, and the surface just outside the
 * ring. Measuring painted pixels takes in the shadows, fills and clipping that sit beside the
 * ring, not only the ancestor surface.
 */
async function ringSamples(tile: HTMLElement, ringElement: HTMLElement, expected: Rgb) {
	const pixels = await renderedPixels(tile);
	const style = getComputedStyle(ringElement);
	const width = Number.parseFloat(style.outlineWidth);
	const offset = Number.parseFloat(style.outlineOffset);
	const box = ringElement.getBoundingClientRect();
	const origin = tile.getBoundingClientRect();
	const at = (x: number, y: number): Rgb => {
		const column = Math.floor((x - origin.left) * pixels.scale);
		const row = Math.floor((y - origin.top) * pixels.scale);
		const index = (row * pixels.width + column) * 4;
		return [pixels.data[index] ?? 0, pixels.data[index + 1] ?? 0, pixels.data[index + 2] ?? 0];
	};
	const middleX = box.left + box.width / 2;
	const middleY = box.top + box.height / 2;
	// Distances from the border box, outward. The gap sits one pixel clear of the box.
	const outside = offset + width + 1.5;
	const gap = Math.min(1, offset / 2);
	const edges = {
		bottom: (distance: number) => at(middleX, box.bottom + distance),
		left: (distance: number) => at(box.left - distance, middleY),
		right: (distance: number) => at(box.right + distance, middleY),
		top: (distance: number) => at(middleX, box.top - distance),
	};
	// A control on a fractional pixel anti-aliases one edge of its ring, so the ring pixel is the
	// one across its width nearest the colour it should paint.
	const ringDistances = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75].map((step) => offset + step);
	return Object.entries(edges).map(([edge, sample]) => ({
		edge,
		gap: sample(gap),
		outside: sample(outside),
		ring: ringDistances
			.map((distance) => sample(distance))
			.toSorted((a, b) => drift(a, expected) - drift(b, expected))[0]!,
	}));
}

function drift(actual: Rgb, expected: Rgb): number {
	return Math.max(...actual.map((value, index) => Math.abs(value - expected[index]!)));
}

for (const appearance of appearances) {
	for (const { control, name } of controls) {
		test(`keeps the ${name} focus ring visible on every supported background in ${appearance.theme} ${appearance.mode}`, async () => {
			render(tilesFor(control), { appearance });
			const failures: Array<string> = [];

			// Each tab stop and its screenshot must finish before the next control takes focus.
			for (const background of backgrounds) {
				// oxlint-disable-next-line no-await-in-loop
				await userEvent.tab();
				const tile = page.getByRole('group', { name: background }).element() as HTMLElement;
				const ringElement = singleRing(tile);
				const style = getComputedStyle(ringElement);
				// The shape and width carry the cue when colour alone cannot.
				expect(style.outlineStyle).toBe('solid');
				expect(style.outlineWidth).toBe('2px');
				expect(style.outlineOffset).toBe('2px');

				const expected = paintedColor(resolvedColor(vars.color.focus, ringElement));
				// oxlint-disable-next-line no-await-in-loop
				for (const sample of await ringSamples(tile, ringElement, expected)) {
					const where = `${background} ${sample.edge}`;
					if (drift(sample.ring, expected) > PAINT_TOLERANCE) {
						failures.push(
							`${where}: ring paints rgb(${sample.ring.join(', ')}), not the focus colour`,
						);
					}
					for (const side of ['gap', 'outside'] as const) {
						const ratio = contrast(sample.ring, sample[side]);
						if (ratio < FOCUS_RATIO) {
							failures.push(`${where}: ring against ${side} is ${ratio.toFixed(2)}:1`);
						}
					}
				}
			}

			expect(failures).toEqual([]);
		});
	}
}

for (const { control, name } of controls) {
	test(`draws the ${name} focus ring in the system highlight under forced colours`, async () => {
		render(control);
		await emulateForcedColors('active');

		await userEvent.tab();

		const ringElement = singleRing(document.body);
		const style = getComputedStyle(ringElement);
		expect(style.outlineStyle).toBe('solid');
		expect(style.outlineWidth).toBe('2px');
		expect(style.outlineColor).toBe(resolvedColor('Highlight', ringElement));
	});
}

test('shows the Button focus ring for keyboard focus and not for a pointer press', async () => {
	render(
		<>
			<Button>First</Button>
			<Button>Second</Button>
		</>,
	);
	const first = page.getByRole('button', { name: 'First' });
	const second = page.getByRole('button', { name: 'Second' });

	await userEvent.click(first);
	await expect.element(first).toHaveFocus();
	expect(visibleRings(document.body)).toHaveLength(0);

	await userEvent.tab();
	await expect.element(second).toHaveFocus();
	expect(visibleRings(document.body)).toEqual([second.element()]);
});

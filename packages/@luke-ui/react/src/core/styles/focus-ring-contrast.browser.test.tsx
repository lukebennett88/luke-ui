import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { ComboboxField, ComboboxItem } from '@luke-ui/react/combobox-field';
import { SelectField, SelectItem } from '@luke-ui/react/select-field';
import { SwitchField } from '@luke-ui/react/switch-field';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { vars } from '@luke-ui/react/theme';
import type { ReactNode } from 'react';
import { afterEach, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { renderedPixels } from '../test-utils/autofill.js';
import { emulateForcedColors } from '../test-utils/emulate-media.js';
import type { Rgb } from '../test-utils/painted-color.js';
import { contrast, paintedColor } from '../test-utils/painted-color.js';
import type { VisualAppearance } from '../test-utils/render.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { resolvedColor } from '../test-utils/surface-colors.js';
import { parkPointer, pressPointer, releasePointer } from '../test-utils/visual.js';
import { waitForOverlayEnter } from '../test-utils/wait-for-overlay-enter.js';

// #955 decision 8 gates `ThemeInput.color.focus` at 3:1 against the three structural surfaces and
// the six role subtle fills. Those nine backgrounds are the supported places for a focus ring.
const supportedBackgrounds = [
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

type TileBackground = (typeof supportedBackgrounds)[number];

// Bundled themes plus the two fixtures that stress the gates: the chromatic brief and a pale
// accent beside a custom raised surface.
const appearances: Array<VisualAppearance> = [
	...visualAppearances,
	{ mode: 'light', theme: 'chromatic' },
	{ mode: 'dark', theme: 'chromatic' },
	{ mode: 'light', theme: 'contrastEdge' },
	{ mode: 'dark', theme: 'contrastEdge' },
];

type State = 'hover' | 'pressed';

const items = [{ id: 'light', label: 'Light' }];

const selectField = (
	<SelectField items={items} label="Theme">
		{(item) => <SelectItem>{item.label}</SelectItem>}
	</SelectField>
);

const comboboxField = (
	<ComboboxField defaultItems={items} label="Theme">
		{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
	</ComboboxField>
);

const controls: Array<{ name: string; control: ReactNode; states?: Array<State> }> = [
	{ name: 'Button', control: <Button>Save</Button>, states: ['hover', 'pressed'] },
	{ name: 'TextInputField', control: <TextInputField label="Name" />, states: ['hover'] },
	{ name: 'CheckboxField', control: <CheckboxField label="Subscribe" /> },
	{
		name: 'selected CheckboxField',
		control: <CheckboxField defaultSelected label="Subscribe" />,
		states: ['hover', 'pressed'],
	},
	{ name: 'SwitchField', control: <SwitchField label="Notifications" /> },
	{
		name: 'selected SwitchField',
		control: <SwitchField defaultSelected label="Notifications" />,
		states: ['hover', 'pressed'],
	},
	{ name: 'SelectField', control: selectField, states: ['hover'] },
	{ name: 'ComboboxField', control: comboboxField },
];

const FOCUS_RATIO = 3;
// Rounding the painted ring to 8-bit sRGB moves it by a level or two.
const PAINT_TOLERANCE = 4;

type Edge = 'top' | 'bottom' | 'left' | 'right';
type Neighbour = 'inner' | 'outer';

afterEach(async () => {
	await releasePointer();
	await emulateForcedColors('none');
	await parkPointer();
});

function tilesFor(backgrounds: ReadonlyArray<TileBackground>, control: ReactNode) {
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

/** Tabs until focus is inside `tile`, so a control with several tab stops still advances. */
async function tabInto(tile: Element) {
	for (let attempt = 0; attempt < 4 && !tile.contains(document.activeElement); attempt++) {
		// oxlint-disable-next-line no-await-in-loop
		await userEvent.tab();
	}
	expect(tile.contains(document.activeElement), 'focus reached the tile').toBe(true);
}

function drift(actual: Rgb, expected: Rgb): number {
	return Math.max(...actual.map((value, index) => Math.abs(value - expected[index]!)));
}

interface Probe {
	/** Which edge and how far along it this probe sits, for failure messages. */
	label: string;
	/** Reads the pixel `outward` CSS pixels beyond the border box, negative for inside it. */
	pixel: (outward: number) => Rgb;
}

/**
 * Probes at several points along the straight part of every edge of `element`'s border box. A
 * rounded corner, including both ends of a pill, is skipped because its ring is curved.
 */
async function edgeProbes(tile: HTMLElement, element: HTMLElement): Promise<Array<Probe>> {
	const pixels = await renderedPixels(tile);
	const box = element.getBoundingClientRect();
	const origin = tile.getBoundingClientRect();
	const radius = Math.min(
		Number.parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0,
		box.width / 2,
		box.height / 2,
	);
	const at = (x: number, y: number): Rgb => {
		const column = Math.floor((x - origin.left) * pixels.scale);
		const row = Math.floor((y - origin.top) * pixels.scale);
		const index = (row * pixels.width + column) * 4;
		return [pixels.data[index] ?? 0, pixels.data[index + 1] ?? 0, pixels.data[index + 2] ?? 0];
	};
	const probes: Array<Probe> = [];
	for (const edge of ['top', 'bottom', 'left', 'right'] as Array<Edge>) {
		const horizontal = edge === 'top' || edge === 'bottom';
		const start = (horizontal ? box.left : box.top) + radius;
		const run = (horizontal ? box.width : box.height) - 2 * radius;
		if (run < 4) continue;
		for (const fraction of [0.25, 0.5, 0.75]) {
			const along = start + run * fraction;
			probes.push({
				label: `${edge} ${Math.round(fraction * 100)}%`,
				pixel: (outward) => {
					switch (edge) {
						case 'top':
							return at(along, box.top - outward);
						case 'bottom':
							return at(along, box.bottom + outward);
						case 'left':
							return at(box.left - outward, along);
						case 'right':
							return at(box.right + outward, along);
					}
				},
			});
		}
	}
	expect(probes.length, 'edges with a straight run to probe').toBeGreaterThan(0);
	return probes;
}

interface RingGeometry {
	offset: number;
	width: number;
}

function geometryOf(element: HTMLElement): RingGeometry {
	const style = getComputedStyle(element);
	return {
		offset: Number.parseFloat(style.outlineOffset),
		width: Number.parseFloat(style.outlineWidth),
	};
}

/**
 * The distances, outward from the border box, that lie inside the ring. They stay half a CSS pixel
 * clear of each edge, so a control on a fractional pixel, whose ring edge anti-aliases, still reads
 * the ring across its width. A ring that is partly clipped or covered fails here.
 */
function ringDistances({ offset, width }: RingGeometry): Array<number> {
	const distances: Array<number> = [];
	for (let step = 0.5; step <= width - 0.5; step += 0.25) distances.push(offset + step);
	return distances;
}

/**
 * Records a failure when any probe's ring pixels, across the ring's width, differ from `expected`,
 * and when the ring does not reach 3:1 against the neighbours the caller names. `inner` is the side
 * towards the control, `outer` the side away from it.
 */
function checkRing(
	probes: Array<Probe>,
	geometry: RingGeometry,
	expected: Rgb,
	neighbours: ReadonlyArray<Neighbour>,
	where: string,
	failures: Array<string>,
) {
	const { offset, width } = geometry;
	const innerAt = offset > 0 ? offset / 2 : offset - 1.5;
	const outerAt = offset + width + 1.5;
	for (const probe of probes) {
		for (const distance of ringDistances(geometry)) {
			const pixel = probe.pixel(distance);
			if (drift(pixel, expected) > PAINT_TOLERANCE) {
				failures.push(
					`${where} ${probe.label}: ring pixel ${distance.toFixed(2)}px out is rgb(${pixel.join(', ')}), not the ring colour`,
				);
				break;
			}
		}
		for (const side of neighbours) {
			const ratio = contrast(expected, probe.pixel(side === 'inner' ? innerAt : outerAt));
			if (ratio < FOCUS_RATIO) {
				failures.push(`${where} ${probe.label}: ring against ${side} is ${ratio.toFixed(2)}:1`);
			}
		}
	}
}

/**
 * Hovers the control, and for `pressed` holds Space down. A pointer press would end keyboard focus
 * visibility, so the keyboard press is the pressed state a focus ring can coexist with.
 */
async function applyState(element: HTMLElement, state: State | undefined) {
	if (state === undefined) return;
	await userEvent.hover(element);
	if (state === 'pressed') await userEvent.keyboard('{Space>}');
}

/**
 * Closes the list a focused combobox opens. The list appears at once when the keyboard opens it,
 * and only once it is positioned, so wait for it to open and for its exit to end.
 */
async function closeOpenedList() {
	await expect.poll(() => document.querySelector('[data-placement]')).not.toBeNull();
	await userEvent.keyboard('{Escape}');
	await expect.poll(() => document.querySelector('[data-placement]')).toBeNull();
}

/**
 * Focuses each tile's control in turn with the keyboard, optionally hovers or presses it, and
 * measures the ring. `neighbours` names what the ring must contrast with; an empty list checks the
 * paint only.
 */
async function measureTiles(
	backgrounds: ReadonlyArray<TileBackground>,
	neighbours: ReadonlyArray<Neighbour>,
	state?: State,
) {
	const failures: Array<string> = [];
	// Open popovers hide the rest of the page from role queries, so find every tile first.
	const tiles = backgrounds.map((background) => {
		return page.getByRole('group', { name: background }).element() as HTMLElement;
	});
	// Each tab stop, state and screenshot must finish before the next control takes focus.
	for (const [index, background] of backgrounds.entries()) {
		const tile = tiles[index]!;
		// oxlint-disable-next-line no-await-in-loop
		await userEvent.keyboard('{/Space}');
		// oxlint-disable-next-line no-await-in-loop
		await tabInto(tile);
		// A combobox opens its list on focus. Close it so only the input ring is measured.
		if (document.activeElement?.getAttribute('role') === 'combobox') {
			// oxlint-disable-next-line no-await-in-loop
			await closeOpenedList();
		}
		const ringElement = singleRing(tile);
		const geometry = geometryOf(ringElement);
		// The shape and width carry the cue when colour alone cannot.
		expect(getComputedStyle(ringElement).outlineStyle).toBe('solid');
		expect([geometry.width, geometry.offset]).toEqual([2, 2]);
		// oxlint-disable-next-line no-await-in-loop
		await applyState(ringElement, state);
		// The state must really apply, or the ring is only measured at rest.
		const attribute = state === 'hover' ? 'data-hovered' : 'data-pressed';
		if (state !== undefined && tile.querySelector(`[${attribute}="true"]`) === null) {
			failures.push(`${background} did not become ${state}`);
		}
		expect(singleRing(tile), 'the ring survives the state').toBe(ringElement);

		const expected = paintedColor(resolvedColor(vars.color.focus, ringElement));
		// oxlint-disable-next-line no-await-in-loop
		const probes = await edgeProbes(tile, ringElement);
		const where = state === undefined ? background : `${background} ${state}`;
		checkRing(probes, geometry, expected, neighbours, where, failures);
	}
	await userEvent.keyboard('{/Space}');
	return failures;
}

for (const appearance of appearances) {
	for (const { control, name } of controls) {
		test(`keeps the ${name} focus ring visible on every supported background in ${appearance.theme} ${appearance.mode}`, async () => {
			render(tilesFor(supportedBackgrounds, control), { appearance });

			expect(await measureTiles(supportedBackgrounds, ['inner', 'outer'])).toEqual([]);
		});
	}
}

for (const appearance of visualAppearances) {
	for (const { control, name, states = [] } of controls) {
		for (const state of states) {
			test(`keeps the ${name} focus ring visible while ${state} on every supported background in ${appearance.theme} ${appearance.mode}`, async () => {
				render(tilesFor(supportedBackgrounds, control), { appearance });

				expect(await measureTiles(supportedBackgrounds, ['inner', 'outer'], state)).toEqual([]);
			});
		}
	}
}

// The active option draws a 2px inset outline in the accent on-solid colour on the solid fill.
// `color.foreground.accent.onSolid` is gated at 3:1 against `accent.solid.rest` and
// `accent.solid.pressed`, so the outline against that fill is a supported pair. The list surface
// outside the option is not gated against the outline, so it is not measured.
for (const appearance of appearances) {
	for (const [name, field] of [
		['SelectField', selectField],
		['ComboboxField', comboboxField],
	] as const) {
		for (const state of ['focused', 'pressed'] as const) {
			test(`keeps the ${name} active option outline visible on its solid fill while ${state} in ${appearance.theme} ${appearance.mode}`, async () => {
				render(field, { appearance });
				await userEvent.tab();
				await userEvent.keyboard('{ArrowDown}');
				const option = page.getByRole('option', { name: 'Light' });
				await expect.element(option).toHaveAttribute('data-focused', 'true');
				const element = option.element() as HTMLElement;
				await waitForOverlayEnter(element.closest('[data-trigger]')!);
				if (state === 'pressed') await pressPointer(element);
				await expect.poll(() => element.hasAttribute('data-pressed')).toBe(state === 'pressed');

				const geometry = geometryOf(element);
				expect([geometry.width, geometry.offset]).toEqual([2, -2]);
				const expected = paintedColor(resolvedColor(vars.color.foreground.accent.onSolid, element));
				const failures: Array<string> = [];
				const probes = await edgeProbes(element, element);
				checkRing(probes, geometry, expected, ['inner'], state, failures);

				expect(failures).toEqual([]);
			});
		}
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

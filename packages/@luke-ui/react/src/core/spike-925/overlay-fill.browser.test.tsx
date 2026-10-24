// SPIKE #925 — throwaway evidence harness, not a component test. It measures computed subtle
// variables and painted fills on the real Combobox, Select, tray, Box, and the reference app's
// Change email dialog, then prints one JSON line per measurement for the report.

import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { ComboboxField, ComboboxItem } from '@luke-ui/react/combobox-field';
import { SelectField, SelectItem } from '@luke-ui/react/select-field';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Modal, ModalOverlay } from 'react-aria-components/Modal';
import { Button as RacButton } from 'react-aria-components/Button';
import { afterAll, expect, test } from 'vite-plus/test';
import { commands, page, userEvent } from 'vite-plus/test/context';
// The reference app's real dialog composition and its app-owned styles.
import { ChangeEmailDialog } from '../../../../../../apps/reference-app/src/components/change-email-dialog.js';
import * as referenceStyles from '../../../../../../apps/reference-app/src/styles/settings.css.js';
import { MOBILE_SCREEN_WIDTH, mockScreenWidth } from '../test-utils/mock-screen-width.js';
import type { VisualAppearance } from '../test-utils/render.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { setInteractionState } from '../test-utils/surface-colors.js';
import { waitForOverlayEnter } from '../test-utils/wait-for-overlay-enter.js';

const SHOTS = 'spike-925-screenshots';
const VARIANT = import.meta.env.VITE_SPIKE_VARIANT ?? 'mechanism';
const rows: Array<unknown> = [];
function record(row: unknown) {
	rows.push(row);
}
afterAll(async () => {
	await commands.writeFile(`${SHOTS}/${VARIANT}/measurements.json`, `${JSON.stringify(rows, null, '\t')}\n`);
});

type Lab = [number, number, number];

function srgbToOklab([r8, g8, b8]: [number, number, number]): Lab {
	const lin = (c: number) => {
		const v = c / 255;
		return v <= 0.040_45 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
	};
	const [r, g, b] = [lin(r8), lin(g8), lin(b8)];
	const l = Math.cbrt(0.412_221_470_8 * r + 0.536_332_536_3 * g + 0.051_445_992_9 * b);
	const m = Math.cbrt(0.211_903_498_2 * r + 0.680_699_545_1 * g + 0.107_396_956_6 * b);
	const s = Math.cbrt(0.088_302_461_9 * r + 0.281_718_837_6 * g + 0.629_978_700_5 * b);
	return [
		0.210_454_255_3 * l + 0.793_617_785 * m - 0.004_072_046_8 * s,
		1.977_998_495_1 * l - 2.428_592_205 * m + 0.450_593_709_9 * s,
		0.025_904_037_1 * l + 0.782_771_766_2 * m - 0.808_675_766 * s,
	];
}

/** OKLab straight from a computed `oklch()` string, or through the canvas for anything else. */
function toOklab(color: string): Lab {
	const match = /^oklch\(([\d.]+)%? ([\d.]+) ([\d.]+|none)/.exec(color);
	if (match) {
		const l = Number(match[1]) > 1 ? Number(match[1]) / 100 : Number(match[1]);
		const c = Number(match[2]);
		const h = match[3] === 'none' ? 0 : (Number(match[3]) * Math.PI) / 180;
		return [l, c * Math.cos(h), c * Math.sin(h)];
	}
	const context = new OffscreenCanvas(1, 1).getContext('2d');
	if (!context) throw new Error('no canvas');
	context.fillStyle = color;
	context.fillRect(0, 0, 1, 1);
	const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data;
	return srgbToOklab([r, g, b]);
}

function distance(a: Lab, b: Lab): number {
	return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

async function decodePng(base64: string): Promise<ImageData> {
	const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
	const bitmap = await createImageBitmap(blob, { colorSpaceConversion: 'none' });
	const context = new OffscreenCanvas(bitmap.width, bitmap.height).getContext('2d');
	if (!context) throw new Error('no canvas');
	context.drawImage(bitmap, 0, 0);
	return context.getImageData(0, 0, bitmap.width, bitmap.height);
}

/** The pixel painted at a fraction of `element`'s box, with its content hidden. */
type Rgb = [number, number, number];

async function paintedPixel(element: HTMLElement, fx = 0.9, fy = 0.5, hide = true): Promise<Lab> {
	return srgbToOklab(await paintedRgb(element, fx, fy, hide));
}

/** The pixel `px`,`py` CSS pixels inside `element`'s top-left corner, content left visible. */
async function pixelAt(element: HTMLElement, px: number, py: number): Promise<Lab> {
	const pixels = await decodePng(await page.screenshot({ element, save: false }));
	const scale = pixels.width / element.getBoundingClientRect().width;
	const offset = (Math.floor(py * scale) * pixels.width + Math.floor(px * scale)) * 4;
	return srgbToOklab([pixels.data[offset] ?? 0, pixels.data[offset + 1] ?? 0, pixels.data[offset + 2] ?? 0]);
}

function canvasRgb(color: string): Rgb {
	const context = new OffscreenCanvas(1, 1).getContext('2d');
	if (!context) throw new Error('no canvas');
	context.fillStyle = color;
	context.fillRect(0, 0, 1, 1);
	const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data;
	return [r, g, b];
}

function luminance(rgb: Rgb): number {
	const [r = 0, g = 0, b = 0] = rgb.map((byte) => {
		const c = byte / 255;
		return c <= 0.040_45 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: Rgb, b: Rgb): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
	return (hi + 0.05) / (lo + 0.05);
}

async function paintedRgb(element: HTMLElement, fx = 0.9, fy = 0.5, hide = true): Promise<Rgb> {
	if (!hide) {
		const pixels = await decodePng(await page.screenshot({ element, save: false }));
		// 3 CSS pixels above the bottom edge: inside the border, inside the content padding.
		const scale = pixels.height / element.getBoundingClientRect().height;
		const offset = ((pixels.height - Math.ceil(3 * scale)) * pixels.width + Math.floor(pixels.width * fx)) * 4;
		return [pixels.data[offset] ?? 0, pixels.data[offset + 1] ?? 0, pixels.data[offset + 2] ?? 0];
	}
	const style = document.createElement('style');
	style.textContent = '[data-spike-hide] * { visibility: hidden !important; }';
	document.head.append(style);
	element.setAttribute('data-spike-hide', '');
	try {
		const shot = await page.screenshot({ element, save: false });
		const pixels = await decodePng(shot);
		const x = Math.floor(pixels.width * fx);
		const y = Math.floor(pixels.height * fy);
		const offset = (y * pixels.width + x) * 4;
		return [pixels.data[offset] ?? 0, pixels.data[offset + 1] ?? 0, pixels.data[offset + 2] ?? 0];
	} finally {
		element.removeAttribute('data-spike-hide');
		style.remove();
	}
}

function settle() {
	for (const animation of document.getAnimations()) {
		if (animation instanceof CSSTransition) animation.finish();
	}
}

type StateName = 'rest' | 'hover' | 'pressed';

const round = (n: number) => Math.round(n * 1000) / 1000;

/** Measures one element through rest, hover, and pressed against the surface it sits on. */
async function measureStates(
	label: string,
	appearance: VisualAppearance,
	element: HTMLElement,
	surface: HTMLElement,
	subtleRole: string,
	probe?: { element: HTMLElement; x: number; y: number },
) {
	const surfaceComputed = getComputedStyle(surface).backgroundColor;
	const surfaceLab = toOklab(surfaceComputed);
	const surfacePainted = probe
		? await pixelAt(probe.element, probe.x, probe.y)
		: await paintedPixel(surface, 0.5, 0.995, false);
	const states: Record<string, unknown> = {};
	// Read end states, not interpolated ones.
	element.style.transition = 'none';
	for (const state of ['rest', 'hover', 'pressed'] as Array<StateName>) {
		setInteractionState(element, state);
		settle();
		const computed = getComputedStyle(element);
		const background = computed.backgroundColor;
		const variable = computed
			.getPropertyValue(`--luke-color-background-${subtleRole}-subtle-${state}`)
			.trim();
		const paintedBytes = await paintedRgb(element);
		const painted = srgbToOklab(paintedBytes);
		states[state] = {
			// WCAG contrast of the computed text colour over the composited fill: the computed
			// background-color with any background-image layer the painted pixel shows on top.
			textContrast: Math.round(contrast(canvasRgb(computed.color), computed.backgroundImage !== 'none' ? paintedBytes : background === 'rgba(0, 0, 0, 0)' ? canvasRgb(surfaceComputed) : canvasRgb(background)) * 100) / 100,
			backgroundImage: computed.backgroundImage === 'none' ? undefined : computed.backgroundImage,
			variable,
			background,
			dComputed: background === 'rgba(0, 0, 0, 0)' ? 0 : round(distance(toOklab(background), surfaceLab)),
			dPainted: round(distance(painted, surfacePainted)),
			paintedL: round(painted[0]),
		};
	}
	setInteractionState(element, 'rest');
	settle();
	element.style.transition = '';
	const row = {
		variant: VARIANT,
		theme: appearance.theme,
		mode: appearance.mode,
		label,
		surface: surfaceComputed,
		surfacePaintedL: round(surfacePainted[0]),
		states,
	};
	record(row);
	return row;
}

/** Reads the public subtle variables an element resolves, for the nesting proofs. */
function subtleVars(element: Element) {
	const computed = getComputedStyle(element);
	return Object.fromEntries(
		['neutral', 'accent'].flatMap((role) =>
			(['rest', 'hover', 'pressed'] as const).map((state) => [
				`${role}.${state}`,
				computed.getPropertyValue(`--luke-color-background-${role}-subtle-${state}`).trim(),
			]),
		),
	);
}

function privateSet(element: Element, set: 'base' | 'overlay') {
	const computed = getComputedStyle(element);
	return Object.fromEntries(
		['neutral', 'accent'].flatMap((role) =>
			(['rest', 'hover', 'pressed'] as const).map((state) => [
				`${role}.${state}`,
				computed.getPropertyValue(`--luke-internal-subtle-${set}-${role}-${state}`).trim(),
			]),
		),
	);
}

function logNesting(appearance: VisualAppearance, label: string, element: Element, expected: string) {
	const actual = subtleVars(element);
	const row = {
		variant: VARIANT,
		theme: appearance.theme,
		mode: appearance.mode,
		label,
		expected,
		colorMode: element.closest('[data-color-mode]')?.getAttribute('data-color-mode'),
		subtle: actual,
		base: privateSet(element, 'base'),
		overlay: privateSet(element, 'overlay'),
	};
	record(row);
	return row;
}

type CountryItem = { id: string; label: string };
const countries: Array<CountryItem> = [
	{ id: 'au', label: 'Australia' },
	{ id: 'ca', label: 'Canada' },
	{ id: 'nz', label: 'New Zealand' },
];

function slug(appearance: VisualAppearance) {
	return `${appearance.theme}-${appearance.mode}`;
}

async function shot(element: HTMLElement, name: string) {
	await page.screenshot({ element, path: `${SHOTS}/${VARIANT}/${name}.png` });
}

async function optionStates(
	appearance: VisualAppearance,
	label: string,
	listbox: HTMLElement,
	surface: HTMLElement,
) {
	// The listbox paints nothing, so its 4px padding shows the surface behind it. Sample mid-width, clear of the rounded corners.
	const probe = { element: listbox, x: listbox.getBoundingClientRect().width / 2, y: 2 };
	const option = (name: string) => {
		const element = [...listbox.querySelectorAll<HTMLElement>('[role="option"]')].find(
			(candidate) => candidate.textContent?.includes(name),
		);
		if (!element) throw new Error(`no option ${name}`);
		return element;
	};
	await measureStates(`${label} unselected option`, appearance, option('Canada'), surface, 'neutral', probe);
	await measureStates(`${label} selected option`, appearance, option('Australia'), surface, 'accent', probe);
	// Representative capture: Canada hovered, Australia selected and pressed.
	setInteractionState(option('Canada'), 'hover');
	setInteractionState(option('Australia'), 'pressed');
	settle();
	await shot(surface, `${label.replaceAll(' ', '-')}-${slug(appearance)}`);
	setInteractionState(option('Canada'), 'rest');
	setInteractionState(option('Australia'), 'rest');
}

const darkAppearances = visualAppearances.filter((appearance) => appearance.mode === 'dark');

for (const appearance of visualAppearances) {
	test(`Combobox popover ${slug(appearance)}`, async () => {
		render(
			<ComboboxField<CountryItem> defaultItems={countries} defaultValue="au" label="Country">
				{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
			</ComboboxField>,
			{ appearance },
		);
		await userEvent.click(page.getByRole('button', { name: /Show suggestions|Country/ }).first());
		const listbox = page.getByRole('listbox').element() as HTMLElement;
		const popover = listbox.closest('[data-trigger="ComboBox"]') as HTMLElement;
		await waitForOverlayEnter(popover);
		record({ label: 'combobox popover data-color-mode', theme: appearance.theme, mode: appearance.mode, attr: popover.getAttribute('data-color-mode') });
		await optionStates(appearance, 'combobox popover', listbox, popover);
	});

	test(`Select popover ${slug(appearance)}`, async () => {
		render(
			<SelectField defaultValue="au" items={countries} label="Country">
				{(item) => <SelectItem>{item.label}</SelectItem>}
			</SelectField>,
			{ appearance },
		);
		await userEvent.click(page.getByRole('button', { name: /Country/ }));
		const listbox = page.getByRole('listbox').element() as HTMLElement;
		const popover = listbox.closest('[data-trigger="Select"]') as HTMLElement;
		await waitForOverlayEnter(popover);
		await optionStates(appearance, 'select popover', listbox, popover);
	});

	test(`Combobox tray ${slug(appearance)}`, async () => {
		mockScreenWidth(MOBILE_SCREEN_WIDTH);
		render(
			<ComboboxField<CountryItem> defaultItems={countries} defaultValue="au" label="Country">
				{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
			</ComboboxField>,
			{ appearance },
		);
		await userEvent.click(page.getByRole('button', { name: 'Country Australia' }));
		await expect.element(page.getByRole('dialog')).toBeVisible();
		await expect.element(page.getByRole('listbox')).toBeVisible();
		const dialog = page.getByRole('dialog').element() as HTMLElement;
		const modal = dialog.parentElement as HTMLElement;
		await waitForOverlayEnter(modal.parentElement as HTMLElement);
		const listbox = page.getByRole('listbox').element() as HTMLElement;
		await optionStates(appearance, 'combobox tray', listbox, modal);
	});

	test(`Reference app Change email dialog as written ${slug(appearance)}`, async () => {
		render(
			<QueryClientProvider client={new QueryClient()}>
				<ChangeEmailDialog email="ada@example.com" />
			</QueryClientProvider>,
			{ appearance },
		);
		await userEvent.click(page.getByRole('button', { name: 'Change email' }));
		const dialog = page.getByRole('dialog').element() as HTMLElement;
		const modal = dialog.parentElement as HTMLElement;
		await waitForOverlayEnter(modal.parentElement as HTMLElement);
		const cancel = page.getByRole('button', { name: 'Cancel' }).element() as HTMLElement;
		await measureStates('reference dialog (as written) low Button', appearance, cancel, modal, 'neutral');
		setInteractionState(cancel, 'hover');
		settle();
		await shot(modal, `reference-dialog-as-written-${slug(appearance)}`);
		setInteractionState(cancel, 'rest');
	});

	test(`Reference app dialog pattern, app CSS surface ${slug(appearance)}`, async () => {
		render(<AppCssDialog />, { appearance });
		await userEvent.click(page.getByRole('button', { name: 'Open' }));
		const dialog = page.getByRole('dialog').element() as HTMLElement;
		const modal = dialog.parentElement as HTMLElement;
		await waitForOverlayEnter(modal.parentElement as HTMLElement);
		const button = (name: string) =>
			page.getByRole('button', { name, exact: true }).element() as HTMLElement;
		await measureStates('app-CSS dialog low Button', appearance, button('Cancel'), modal, 'neutral');
		await measureStates('app-CSS dialog standard Button', appearance, button('Standard'), modal, 'neutral');
		setInteractionState(button('Cancel'), 'hover');
		setInteractionState(button('Standard'), 'pressed');
		settle();
		await shot(modal, `app-css-dialog-${slug(appearance)}`);
		setInteractionState(button('Cancel'), 'rest');
		setInteractionState(button('Standard'), 'rest');
	});

	test(`Reference app dialog styles with a Box overlay root ${slug(appearance)}`, async () => {
		render(<BoxDialog />, { appearance });
		await userEvent.click(page.getByRole('button', { name: 'Open' }));
		const dialog = page.getByRole('dialog').element() as HTMLElement;
		const modal = dialog.parentElement as HTMLElement;
		await waitForOverlayEnter(modal.parentElement as HTMLElement);
		const button = (name: string) =>
			page.getByRole('button', { name, exact: true }).element() as HTMLElement;
		await measureStates('Box dialog low Button', appearance, button('Cancel'), modal, 'neutral');
		await measureStates('Box dialog standard Button', appearance, button('Standard'), modal, 'neutral');
		for (const surface of ['base', 'subdued', 'field'] as const) {
			const nested = button(`On ${surface}`);
			const box = nested.closest('[data-spike-surface]') as HTMLElement;
			await measureStates(`Box dialog > Box surface.${surface} low Button`, appearance, nested, box, 'neutral');
			logNesting(appearance, `Box surface.${surface} inside overlay`, nested, 'base');
		}
		logNesting(appearance, 'Box dialog content', button('Cancel'), 'overlay');
		setInteractionState(button('Cancel'), 'hover');
		setInteractionState(button('Standard'), 'pressed');
		settle();
		await shot(modal, `box-dialog-${slug(appearance)}`);
		setInteractionState(button('Cancel'), 'rest');
		setInteractionState(button('Standard'), 'rest');
	});
}

/** The reference app's dialog pattern: app CSS paints `vars.color.surface.overlay` on the Modal. */
function AppCssDialog() {
	return (
		<DialogTrigger>
			<RacButton>Open</RacButton>
			<ModalOverlay className={referenceStyles.dialogOverlay}>
				<Modal className={referenceStyles.dialogModal}>
					<Dialog aria-label="App CSS dialog" className={referenceStyles.dialog}>
						<Cluster gap="space.8">
							<Button prominence="low">Cancel</Button>
							<Button>Standard</Button>
						</Cluster>
					</Dialog>
				</Modal>
			</ModalOverlay>
		</DialogTrigger>
	);
}

function BoxDialog({ children }: { children?: ReactNode }) {
	return (
		<DialogTrigger>
			<RacButton>Open</RacButton>
			<ModalOverlay className={referenceStyles.dialogOverlay}>
				<Box
					backgroundColor="surface.overlay"
					renderRoot={(domProps) => (
						<Modal {...domProps} className={`${domProps.className ?? ''} ${referenceStyles.dialogModal}`} />
					)}
				>
					<Dialog aria-label="Box dialog" className={referenceStyles.dialog}>
						<Stack gap="space.16">
							<Text>Overlay content</Text>
							<Cluster gap="space.8">
								<Button prominence="low">Cancel</Button>
								<Button>Standard</Button>
							</Cluster>
							{(['base', 'subdued', 'field'] as const).map((surface) => (
								<Box
									backgroundColor={`surface.${surface}`}
									data-spike-surface={surface}
									key={surface}
									padding="space.8"
								>
									<Button prominence="low">{`On ${surface}`}</Button>
								</Box>
							))}
							{children}
						</Stack>
					</Dialog>
				</Box>
			</ModalOverlay>
		</DialogTrigger>
	);
}

// Page surfaces outside any overlay: residuals against today's base-tuned fills, and the
// fallback's layer over a solid fill.
for (const appearance of visualAppearances) {
	test(`Buttons on page surfaces ${slug(appearance)}`, async () => {
		render(
			<Stack gap="space.8">
				{(['surface.base', 'surface.subdued', 'accent.solid'] as const).map((background) => (
					<Box backgroundColor={background} data-spike-surface={background} key={background} padding="space.8">
						<Cluster gap="space.8">
							<Button prominence="low">{`Low on ${background}`}</Button>
							<Button>{`Standard on ${background}`}</Button>
						</Cluster>
					</Box>
				))}
			</Stack>,
			{ appearance },
		);
		for (const background of ['surface.base', 'surface.subdued', 'accent.solid'] as const) {
			for (const kind of ['Low', 'Standard'] as const) {
				const button = page.getByRole('button', { name: `${kind} on ${background}` }).element() as HTMLElement;
				const box = button.closest('[data-spike-surface]') as HTMLElement;
				await measureStates(`page ${background} ${kind.toLowerCase()} Button`, appearance, button, box, 'neutral');
			}
		}
	});
}

// Proof 1 and 2b: a dark scope on a light page. The popover copies `data-color-mode="dark"`, so the
// unlayered theme rule redeclares every subtle token on the overlay element itself.
for (const theme of ['paper', 'tactile'] as const) {
	const appearance: VisualAppearance = { mode: 'light', theme };
	test(`Dark-scoped Combobox on a light page ${theme}`, async () => {
		render(
			<div data-color-mode="dark" style={{ padding: 8 }}>
				<ComboboxField<CountryItem> defaultItems={countries} defaultValue="au" label="Country">
					{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
				</ComboboxField>
			</div>,
			{ appearance },
		);
		await userEvent.click(page.getByRole('button', { name: /Show suggestions|Country/ }).first());
		const listbox = page.getByRole('listbox').element() as HTMLElement;
		const popover = listbox.closest('[data-trigger="ComboBox"]') as HTMLElement;
		await waitForOverlayEnter(popover);
		expect(popover.getAttribute('data-color-mode')).toBe('dark');
		logNesting({ mode: 'dark', theme }, 'dark-scoped popover element (on light page)', popover, 'overlay');
		await optionStates({ mode: 'dark', theme }, 'dark-scoped combobox popover on light page', listbox, popover);
	});

	test(`Dark-scoped dialog on a light page ${theme}`, async () => {
		render(
			<div data-color-mode="dark">
				<BoxDialog />
			</div>,
			{ appearance },
		);
		await userEvent.click(page.getByRole('button', { name: 'Open' }));
		const dialog = page.getByRole('dialog').element() as HTMLElement;
		const modal = dialog.parentElement as HTMLElement;
		await waitForOverlayEnter(modal.parentElement as HTMLElement);
		logNesting(appearance, 'dialog content (RAC Modal does not copy the scope)', dialog, 'n/a');
	});
}

// Proof 2a: a light scope inside a dark overlay gets light base values.
for (const appearance of darkAppearances) {
	test(`Light scope inside a dark overlay ${slug(appearance)}`, async () => {
		render(
			<BoxDialog>
				<div data-color-mode="light" data-spike-surface="light-scope" style={{ padding: 8 }}>
					<Button prominence="low">In light scope</Button>
				</div>
			</BoxDialog>,
			{ appearance },
		);
		await userEvent.click(page.getByRole('button', { name: 'Open' }));
		const dialog = page.getByRole('dialog').element() as HTMLElement;
		const modal = dialog.parentElement as HTMLElement;
		await waitForOverlayEnter(modal.parentElement as HTMLElement);
		const inner = page.getByRole('button', { name: 'In light scope' }).element() as HTMLElement;
		logNesting(appearance, 'light scope inside dark overlay', inner, 'light base');
		const scope = inner.closest('[data-spike-surface]') as HTMLElement;
		await measureStates('light scope inside dark overlay low Button', { ...appearance, mode: 'light' }, inner, scope, 'neutral');
	});
}

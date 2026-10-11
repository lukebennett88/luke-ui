import { ComboboxField } from '@luke-ui/react/combobox-field';
import {
	ComboboxControl,
	ComboboxInput,
	ComboboxItem,
	ComboboxListBox,
	ComboboxPopover,
	ComboboxRoot,
} from '@luke-ui/react/primitives/combobox';
import { Field } from '@luke-ui/react/primitives/field';
import {
	SelectItem,
	SelectListBox,
	SelectPopover,
	SelectRoot,
	SelectTrigger,
	SelectValue,
} from '@luke-ui/react/primitives/select';
import { SelectField } from '@luke-ui/react/select-field';
import type { ReactNode } from 'react';
import { afterEach, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { MOBILE_SCREEN_WIDTH, mockScreenWidth } from '../test-utils/mock-screen-width.js';
import { render } from '../test-utils/render.js';
import { waitForOverlayEnter } from '../test-utils/wait-for-overlay-enter.js';

const items = [
	{ id: 'one', label: 'Option one' },
	{ id: 'two', label: 'Option two' },
];

type OverlayKind = 'select popover' | 'combobox popover' | 'combobox tray';

const overlayKinds: ReadonlyArray<OverlayKind> = [
	'select popover',
	'combobox popover',
	'combobox tray',
];

const observers: Array<MutationObserver> = [];

afterEach(() => {
	for (const observer of observers) observer.disconnect();
	observers.length = 0;
});

function Overlay({ kind }: { kind: OverlayKind }) {
	if (kind === 'select popover') {
		return (
			<SelectField items={items} label="Example select">
				{(item) => <SelectItem>{item.label}</SelectItem>}
			</SelectField>
		);
	}
	return (
		<ComboboxField defaultItems={items} label="Example combobox">
			{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
		</ComboboxField>
	);
}

/** Matches the portalled element each overlay copies the mode onto. */
const OVERLAY_SELECTOR: Record<OverlayKind, string> = {
	'combobox popover': '[data-trigger="ComboBox"]',
	'combobox tray': '[role="dialog"]',
	'select popover': '[data-trigger="Select"]',
};

function findOverlay(kind: OverlayKind): HTMLElement {
	const element = document.querySelector<HTMLElement>(OVERLAY_SELECTOR[kind]);
	if (element === null) throw new Error(`expected the ${kind} to be open`);
	// The tray copies the mode onto its modal overlay, two levels above the dialog.
	const overlay = kind === 'combobox tray' ? element.parentElement?.parentElement : element;
	if (overlay == null) throw new Error('expected the tray overlay structure');
	return overlay;
}

function renderOverlay(kind: OverlayKind, scope: (overlay: ReactNode) => ReactNode) {
	if (kind === 'combobox tray') mockScreenWidth(MOBILE_SCREEN_WIDTH);
	return render(scope(<Overlay kind={kind} />), {
		appearance: { mode: 'light', theme: 'tactile' },
	});
}

async function openOverlay(kind: OverlayKind): Promise<HTMLElement> {
	if (kind === 'select popover') {
		await userEvent.click(page.getByRole('button', { name: /Example select/ }));
	} else if (kind === 'combobox popover') {
		await userEvent.click(page.getByRole('combobox', { name: 'Example combobox' }));
	} else {
		await userEvent.click(page.getByRole('button', { name: /Example combobox/ }));
	}
	await expect.poll(() => document.querySelector(OVERLAY_SELECTOR[kind])).not.toBeNull();
	const overlay = findOverlay(kind);
	await waitForOverlayEnter(overlay);
	return overlay;
}

function surfaceBase(element: Element): string {
	return getComputedStyle(element).getPropertyValue('--luke-color-surface-base');
}

/**
 * Records the overlay element's mode at the moment it is inserted, before any frame renders, so a
 * correction applied after the first paint cannot pass.
 */
function observeFirstInsertion(kind: OverlayKind) {
	const seen: Array<{ colorScheme: string; mode: string | null }> = [];
	const observer = new MutationObserver((records) => {
		for (const record of records) {
			for (const node of record.addedNodes) {
				if (!(node instanceof HTMLElement)) continue;
				const target = node.matches(OVERLAY_SELECTOR[kind])
					? node
					: node.querySelector<HTMLElement>(OVERLAY_SELECTOR[kind]);
				if (target === null) continue;
				const overlay = kind === 'combobox tray' ? target.parentElement?.parentElement : target;
				if (overlay == null) continue;
				seen.push({
					colorScheme: getComputedStyle(overlay).colorScheme,
					mode: overlay.getAttribute('data-color-mode'),
				});
			}
		}
	});
	observer.observe(document.body, { childList: true, subtree: true });
	observers.push(observer);
	return seen;
}

for (const kind of overlayKinds) {
	test(`the ${kind} opens dark inside a dark scope on a light page, from its first frame`, async () => {
		const { container } = renderOverlay(kind, (overlay) => (
			<div data-color-mode="dark">{overlay}</div>
		));
		const scope = container.querySelector('[data-color-mode="dark"]');
		if (scope === null) throw new Error('expected the dark scope');
		const firstFrames = observeFirstInsertion(kind);

		const overlay = await openOverlay(kind);

		expect(firstFrames[0]).toEqual({ colorScheme: 'dark', mode: 'dark' });
		expect(overlay).toHaveAttribute('data-color-mode', 'dark');
		expect(getComputedStyle(overlay).colorScheme).toBe('dark');
		expect(surfaceBase(overlay)).toBe(surfaceBase(scope));
		expect(surfaceBase(overlay)).not.toBe(surfaceBase(document.documentElement));
		// The overlay sits in <body>, outside the scope, so the paint has to come from its own mode.
		expect(getComputedStyle(overlay).color).toBe(getComputedStyle(scope).color);
		expect(getComputedStyle(overlay).color).not.toBe(getComputedStyle(document.body).color);
		const option = page.getByRole('option', { name: 'Option one' }).element();
		expect(getComputedStyle(option).color).toBe(getComputedStyle(scope).color);
		expect(getComputedStyle(overlay).fontFamily).toBe(getComputedStyle(document.body).fontFamily);
	});

	test(`the ${kind} copies no mode outside a scope below <html>`, async () => {
		renderOverlay(kind, (overlay) => overlay);

		const overlay = await openOverlay(kind);

		expect(overlay).not.toHaveAttribute('data-color-mode');
		expect(surfaceBase(overlay)).toBe(surfaceBase(document.documentElement));
		expect(getComputedStyle(overlay).color).toBe(getComputedStyle(document.body).color);
		expect(getComputedStyle(overlay).fontFamily).toBe(getComputedStyle(document.body).fontFamily);
	});
}

test('an app attribute on the overlay reaches the DOM and wins, even when it equals the document mode', async () => {
	render(
		<div data-color-mode="dark">
			<ComboboxRoot defaultItems={items}>
				<Field label="Example combobox">
					<ComboboxControl>
						<ComboboxInput />
					</ComboboxControl>
					<ComboboxPopover data-color-mode="light">
						<ComboboxListBox<(typeof items)[number]>>
							{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
						</ComboboxListBox>
					</ComboboxPopover>
				</Field>
			</ComboboxRoot>
		</div>,
		{ appearance: { mode: 'light', theme: 'tactile' } },
	);

	await userEvent.click(page.getByRole('combobox', { name: 'Example combobox' }));
	await expect.poll(() => document.querySelector('[data-trigger="ComboBox"]')).not.toBeNull();
	const overlay = findOverlay('combobox popover');

	expect(overlay).toHaveAttribute('data-color-mode', 'light');
	expect(getComputedStyle(overlay).colorScheme).toBe('light');
});

test('a programmatic open copies the scope mode', async () => {
	render(
		<div data-color-mode="dark">
			<SelectRoot isOpen>
				<Field label="Example select">
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectPopover>
						<SelectListBox items={items}>
							{(item) => <SelectItem>{item.label}</SelectItem>}
						</SelectListBox>
					</SelectPopover>
				</Field>
			</SelectRoot>
		</div>,
		{ appearance: { mode: 'light', theme: 'tactile' } },
	);

	await expect.poll(() => document.querySelector('[data-trigger="Select"]')).not.toBeNull();
	expect(findOverlay('select popover')).toHaveAttribute('data-color-mode', 'dark');
});

test('overlay surfaces keep their own background inside a repainted scope', async () => {
	renderOverlay('select popover', (overlay) => <div data-color-mode="dark">{overlay}</div>);

	const overlay = await openOverlay('select popover');
	const probe = document.body.appendChild(document.createElement('div'));
	probe.style.backgroundColor = getComputedStyle(overlay).getPropertyValue(
		'--luke-color-surface-overlay',
	);
	const expected = getComputedStyle(probe).backgroundColor;
	probe.remove();

	expect(getComputedStyle(overlay).backgroundColor).toBe(expected);
});

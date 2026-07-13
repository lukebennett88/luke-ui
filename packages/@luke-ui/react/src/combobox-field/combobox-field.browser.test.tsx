import { afterEach, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import {
	comboboxTrayKeyboardInsetVar,
	comboboxTrayViewportHeightVar,
} from '../recipes/combobox.css.js';
import { cleanupVisual, renderVisual } from '../test-utils/render-visual.js';
import { ComboboxField } from './index.js';
import { ComboboxItem } from './primitive/index.js';

type CountryItem = {
	id: string;
	label: string;
};

const countryItems: Array<CountryItem> = [
	{ id: 'au', label: 'Australia' },
	{ id: 'ca', label: 'Canada' },
];

const renderCountryItem = (item: CountryItem) => <ComboboxItem>{item.label}</ComboboxItem>;

/**
 * The tray slides in via a `translate` transition (see `combobox.css.ts`), and RAC keeps it
 * mounted for the whole transition. Resolves immediately if the tray has already settled
 * (`translate: none`), otherwise waits for that transition to end — matching the same event
 * `useVisualViewportVars` listens for to correct a mid-transition geometry reading.
 */
async function waitForTraySettled(element: HTMLElement): Promise<void> {
	if (window.getComputedStyle(element).translate === 'none') return;
	await new Promise<void>((resolve) => {
		element.addEventListener('transitionend', function handleTransitionEnd(event) {
			if (event.propertyName !== 'translate') return;
			element.removeEventListener('transitionend', handleTransitionEnd);
			resolve();
		});
	});
}

const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'visualViewport');

afterEach(() => {
	cleanupVisual();
	if (originalDescriptor) {
		Object.defineProperty(window, 'visualViewport', originalDescriptor);
	} else {
		// @ts-expect-error -- deleting a test-only own property
		delete window.visualViewport;
	}
});

test('sets the tray viewport height and keyboard inset custom properties from visualViewport', async () => {
	// Narrower than the tray media query's 640px breakpoint, so the popover renders as the
	// fixed-position bottom tray instead of the desktop absolutely-positioned popover — the
	// `getBoundingClientRect()`-based measurement in `useVisualViewportVars` only means
	// anything once the tray is actually pinned to the viewport's bottom edge.
	await page.viewport(390, 844);

	// `window.innerHeight` reflects the viewport set above, so this simulates the on-screen
	// keyboard having shrunk the visual viewport by 300px versus the full layout viewport.
	const fake = Object.assign(new EventTarget(), {
		height: window.innerHeight - 300,
		offsetTop: 0,
	});
	Object.defineProperty(window, 'visualViewport', { configurable: true, value: fake });

	renderVisual(
		<ComboboxField
			defaultItems={countryItems}
			label="Country"
			name="country"
			placeholder="Select a country..."
		>
			{renderCountryItem}
		</ComboboxField>,
	);

	await userEvent.click(page.getByRole('combobox', { name: 'Country' }));
	await expect.element(page.getByRole('listbox')).toBeInTheDocument();

	const popover = document.querySelector('[role="listbox"]')?.parentElement;
	if (!popover) throw new Error('expected the listbox to have a popover parent');

	// Let the tray's own enter transition finish before measuring: mid-transition, the tray is
	// still `translate`d towards its resting position, so `getBoundingClientRect()` would read
	// an offset that doesn't reflect where the tray actually settles.
	await waitForTraySettled(popover);

	expect(popover.style.getPropertyValue(comboboxTrayViewportHeightVar)).toBe(`${fake.height}px`);

	// Mirrors the hook's own measurement rather than a parallel formula: the tray's real
	// rendered bottom edge (pinned by `insetBlockEnd: 0 !important`) versus the fake visual
	// viewport's visible bottom. Reading the DOM directly here means the test can't silently
	// drift from the implementation the way the previous `window.screen.height`-based formula
	// did.
	const expectedInset = `${Math.max(0, popover.getBoundingClientRect().bottom - (fake.offsetTop + fake.height))}px`;
	expect(popover.style.getPropertyValue(comboboxTrayKeyboardInsetVar)).toBe(expectedInset);

	fake.height -= 100;
	fake.dispatchEvent(new Event('resize'));

	expect(popover.style.getPropertyValue(comboboxTrayViewportHeightVar)).toBe(`${fake.height}px`);

	const expectedInset2 = `${Math.max(0, popover.getBoundingClientRect().bottom - (fake.offsetTop + fake.height))}px`;
	expect(popover.style.getPropertyValue(comboboxTrayKeyboardInsetVar)).toBe(expectedInset2);
});

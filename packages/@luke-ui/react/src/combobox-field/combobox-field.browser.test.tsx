import { createRef } from 'react';
import { afterEach, expect, test } from 'vite-plus/test';
import type { Locator } from 'vite-plus/test/context';
import { page, userEvent } from 'vite-plus/test/context';
import {
	comboboxTrayScrollOffsetVar,
	comboboxTrayViewportHeightVar,
} from '../recipes/combobox.css.js';
import { cleanupVisual, renderVisual } from '../test-utils/render-visual.js';
import { ComboboxField } from './index.js';
import { ComboboxInputGroup } from './primitive/input-group.js';
import { ComboboxInput } from './primitive/input.js';
import { ComboboxItem } from './primitive/item.js';
import { ComboboxRoot } from './primitive/root.js';

type CountryItem = {
	id: string;
	label: string;
};

const countryItems: Array<CountryItem> = [
	{ id: 'au', label: 'Australia' },
	{ id: 'ca', label: 'Canada' },
];

const renderCountryItem = (item: CountryItem) => <ComboboxItem>{item.label}</ComboboxItem>;

afterEach(() => {
	cleanupVisual();
});

// A real on-screen keyboard cannot be simulated in this headless browser test, so this asserts
// the CSS contract, that the padding derives from the visible-viewport-height custom property,
// rather than actual device behaviour.
test('the tray spends the keyboard inset on bottom padding', async () => {
	// Confirms the assumption behind the tray media query, rather than just trusting it: this
	// browser project's viewport is 414x896, comfortably inside `(width < 40rem)`.
	expect(window.innerWidth).toBe(414);
	expect(window.innerHeight).toBe(896);

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

	expect(getComputedStyle(popover).position).toBe('absolute');

	// Stands in for the keyboard shrinking the visible viewport.
	popover.style.setProperty(comboboxTrayViewportHeightVar, '500px');

	expect(getComputedStyle(popover).paddingBlockEnd).toBe(`${window.innerHeight - 500}px`);
});

// React Aria opens the combobox popover as non-modal, so `useCloseOnScroll` closes it on any
// document scroll instead of letting the tray drift. The offset only has to be right at the
// moment the tray opens.
test('the tray captures the scroll offset once when it opens', async () => {
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

	// A tall spacer makes the page scrollable so there is an offset to capture.
	const spacer = document.createElement('div');
	spacer.style.blockSize = '300vh';
	document.body.append(spacer);

	try {
		window.scrollTo(0, 120);
		expect(window.scrollY).toBeGreaterThan(0);

		await userEvent.click(page.getByRole('combobox', { name: 'Country' }));
		await expect.element(page.getByRole('listbox')).toBeInTheDocument();

		const popover = document.querySelector('[role="listbox"]')?.parentElement;
		if (!popover) throw new Error('expected the listbox to have a popover parent');

		expect(popover.style.getPropertyValue(comboboxTrayScrollOffsetVar)).toBe(`${window.scrollY}px`);
	} finally {
		window.scrollTo(0, 0);
		spacer.remove();
	}
});

// Proves the invalid cue survives without `errorMessage`, which `composeField` treats
// as optional and which would otherwise leave the field colour-only and imperceptible.
// The border stays at the resting 1px (see `combobox.css.ts`): the in-control icon is
// the non-colour cue here, so the proof is the icon's presence plus the gated border
// colour, not a border-width change.
test('invalid without an error message still carries a non-colour cue', async () => {
	renderVisual(
		<>
			<ComboboxField defaultItems={countryItems} label="Resting" name="resting">
				{renderCountryItem}
			</ComboboxField>
			<ComboboxField defaultItems={countryItems} isInvalid label="Invalid" name="invalid">
				{renderCountryItem}
			</ComboboxField>
		</>,
	);

	const restingInput = page.getByRole('combobox', { name: 'Resting' });
	const invalidInput = page.getByRole('combobox', { name: 'Invalid' });
	await expect.element(invalidInput).toBeVisible();

	const restingControl = restingInput.element().closest<HTMLElement>('[role="group"]');
	const invalidControl = invalidInput.element().closest<HTMLElement>('[role="group"]');
	if (restingControl == null || invalidControl == null) {
		throw new Error('Expected both combobox control groups.');
	}

	const icon = getComputedStyle(invalidControl, '::after');
	expect(icon.content).toBe('""');
	expect(icon.maskImage).not.toBe('none');

	expect(getComputedStyle(invalidControl).borderWidth).toBe('1px');
	expect(getComputedStyle(invalidControl).borderColor).not.toBe(
		getComputedStyle(restingControl).borderColor,
	);
});

// A React Aria upgrade that stopped publishing these on `GroupContext` would silently stop the state selectors matching.
test('the control group carries its own disabled and invalid attributes', async () => {
	renderVisual(
		<>
			<ComboboxField defaultItems={countryItems} isDisabled label="Disabled" name="disabled">
				{renderCountryItem}
			</ComboboxField>
			<ComboboxField defaultItems={countryItems} isInvalid label="Invalid" name="invalid">
				{renderCountryItem}
			</ComboboxField>
			<ComboboxField defaultItems={countryItems} label="Resting" name="resting">
				{renderCountryItem}
			</ComboboxField>
		</>,
	);

	const disabledControl = getControl('Disabled');
	const invalidControl = getControl('Invalid');
	const restingControl = getControl('Resting');

	expect(disabledControl.dataset.disabled).toBe('true');
	expect(invalidControl.dataset.invalid).toBe('true');

	// The trigger is disabled too, but it is not what carries the group's treatment.
	expect(disabledControl.querySelector('button')?.disabled).toBe(true);

	const disabledStyle = getComputedStyle(disabledControl);
	expect(disabledStyle.opacity).toBe('0.55');
	expect(disabledStyle.cursor).toBe('not-allowed');

	const invalidStyle = getComputedStyle(invalidControl);
	expect(invalidStyle.borderColor).not.toBe(getComputedStyle(restingControl).borderColor);
	expect(getComputedStyle(invalidControl, '::after').content).toBe('""');
});

// React Aria disables the trigger on a read-only combobox, which must not make the control read as disabled.
test('read-only controls keep the read-only material, not the disabled one', async () => {
	renderVisual(
		<>
			<ComboboxField defaultItems={countryItems} isReadOnly label="Read-only" name="readOnly">
				{renderCountryItem}
			</ComboboxField>
			<ComboboxField defaultItems={countryItems} isDisabled label="Disabled" name="disabled">
				{renderCountryItem}
			</ComboboxField>
			<ComboboxField defaultItems={countryItems} label="Resting" name="resting">
				{renderCountryItem}
			</ComboboxField>
		</>,
	);

	const readOnlyControl = getControl('Read-only');
	const restingControl = getControl('Resting');

	// The group itself is not disabled, even though the trigger inside it is.
	expect(readOnlyControl.dataset.disabled).toBeUndefined();
	expect(readOnlyControl.querySelector('button')?.disabled).toBe(true);

	const readOnlyStyle = getComputedStyle(readOnlyControl);
	const restingStyle = getComputedStyle(restingControl);
	expect(readOnlyStyle.opacity).toBe('1');
	expect(readOnlyStyle.cursor).toBe(restingStyle.cursor);
	// The read-only slot flattens the recessed well: no depth, decorative border.
	expect(readOnlyStyle.boxShadow).toBe('none');
	expect(restingStyle.boxShadow).not.toBe('none');
	expect(readOnlyStyle.borderColor).not.toBe(restingStyle.borderColor);
	expect(getComputedStyle(getControl('Disabled')).opacity).toBe('0.55');
});

test('the indicator icon adds no text to the accessible name', async () => {
	renderVisual(
		<ComboboxField defaultItems={countryItems} isInvalid label="Invalid" name="invalid">
			{renderCountryItem}
		</ComboboxField>,
	);

	const input = page.getByRole('combobox', { name: 'Invalid' });
	await expect.element(input).toHaveAccessibleName('Invalid');
});

// The primitive renders the control itself, so it takes a plain `ref`.
test('ComboboxInput resolves a ref object to the input element', async () => {
	const ref = createRef<HTMLInputElement>();
	renderVisual(
		<ComboboxRoot<CountryItem> aria-label="Country" defaultItems={countryItems}>
			<ComboboxInputGroup>
				<ComboboxInput ref={ref} />
			</ComboboxInputGroup>
		</ComboboxRoot>,
	);

	const input = page.getByRole('combobox', { name: 'Country' });
	await expect.element(input).toBeVisible();

	expect(ref.current).toBeInstanceOf(HTMLInputElement);
	expect(ref.current).toBe(input.element());
});

test('ComboboxInput resolves a callback ref to the input element', async () => {
	const resolved: Array<HTMLInputElement | null> = [];
	renderVisual(
		<ComboboxRoot<CountryItem> aria-label="Country" defaultItems={countryItems}>
			<ComboboxInputGroup>
				<ComboboxInput
					ref={(node) => {
						resolved.push(node);
					}}
				/>
			</ComboboxInputGroup>
		</ComboboxRoot>,
	);

	const input = page.getByRole('combobox', { name: 'Country' });
	await expect.element(input).toBeVisible();

	expect(resolved.at(-1)).toBeInstanceOf(HTMLInputElement);
	expect(resolved.at(-1)).toBe(input.element());
});

// The composed field takes no plain `ref`, so `inputRef` must reach the editable
// text input rather than the root `<div>` or the control group around it.
test('ComboboxField resolves inputRef to the input element, not a wrapper', async () => {
	const ref = createRef<HTMLInputElement>();
	renderVisual(
		<ComboboxField defaultItems={countryItems} inputRef={ref} label="Country" name="country">
			{renderCountryItem}
		</ComboboxField>,
	);

	const input = page.getByRole('combobox', { name: 'Country' });
	await expect.element(input).toBeVisible();

	expect(ref.current).toBeInstanceOf(HTMLInputElement);
	expect(ref.current).toBe(input.element());
});

test('ComboboxField resolves a callback inputRef to the input element', async () => {
	const resolved: Array<HTMLInputElement | null> = [];
	renderVisual(
		<ComboboxField
			defaultItems={countryItems}
			inputRef={(node) => {
				resolved.push(node);
			}}
			label="Country"
			name="country"
		>
			{renderCountryItem}
		</ComboboxField>,
	);

	const input = page.getByRole('combobox', { name: 'Country' });
	await expect.element(input).toBeVisible();

	expect(resolved.at(-1)).toBeInstanceOf(HTMLInputElement);
	expect(resolved.at(-1)).toBe(input.element());
});

// `name` lands on the hidden input React Aria renders for form submission, not on
// the visible combobox — the visible one holds the filter text, which is not the
// value. The submitted value is the selected key by default (`formValue`).
test('ComboboxField forwards name so a native form submit collects the selected key', async () => {
	const scene = renderVisual(
		<form>
			<ComboboxField defaultItems={countryItems} label="Country" name="country">
				{renderCountryItem}
			</ComboboxField>
		</form>,
	);

	const input = page.getByRole('combobox', { name: 'Country' });
	await expect.element(input).toBeVisible();
	expect(input.element()).not.toHaveAttribute('name');

	const form = scene.element().querySelector('form');
	if (form == null) throw new Error('Expected the form element.');
	expect(new FormData(form).get('country')).toBe('');

	await userEvent.click(input);

	const option = page.getByRole('option', { name: 'Canada' });
	await expect.element(option).toBeInTheDocument();

	await waitForTrayToSettle(option);
	await userEvent.click(option);

	expect(new FormData(form).get('country')).toBe('ca');
});

test('ComboboxField forwards onBlur to the input', async () => {
	const blurs: Array<string> = [];
	renderVisual(
		<>
			<ComboboxField
				defaultItems={countryItems}
				label="Country"
				name="country"
				onBlur={() => {
					blurs.push('country');
				}}
			>
				{renderCountryItem}
			</ComboboxField>
			<button type="button">Next</button>
		</>,
	);

	const input = page.getByRole('combobox', { name: 'Country' });
	await expect.element(input).toBeVisible();

	await userEvent.click(input);
	await expect.element(input).toHaveFocus();
	expect(blurs).toEqual([]);

	// Clicking the input opens the listbox, whose popover would swallow the click on
	// the button behind it; Escape closes it without moving focus.
	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();

	await userEvent.click(page.getByRole('button', { name: 'Next' }));
	expect(blurs).toEqual(['country']);
});

/**
 * Waits for the tray's slide-up transition on `option` to settle.
 *
 * This browser project runs at a tray viewport, so the popover slides up while `position:
 * absolute`. Mid-slide it briefly extends past the initial containing block, making the short
 * page scrollable. Playwright would then scroll the option into view, and React Aria closes this
 * non-modal popover on scroll, detaching it before the click lands.
 */
async function waitForTrayToSettle(option: Locator) {
	let previousTop = Number.NaN;
	await expect
		.poll(() => {
			const top = option.element().getBoundingClientRect().top;
			const settled = top === previousTop;
			previousTop = top;
			return settled;
		})
		.toBe(true);
}

/** The control group wrapping the combobox input labelled `name`. */
function getControl(name: string) {
	const control = page
		.getByRole('combobox', { name })
		.element()
		.closest<HTMLElement>('[role="group"]');
	if (control == null) throw new Error(`Expected a control group for the "${name}" combobox.`);
	return control;
}

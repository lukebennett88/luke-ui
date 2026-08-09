import { createRef } from 'react';
import { afterEach, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { testFieldShapedConformance, testIntegration } from '../conformance/helpers.js';
import {
	comboboxTrayKeyboardInsetVar,
	comboboxTrayViewportHeightVar,
} from '../recipes/combobox.css.js';
import { render } from '../test-utils/render.js';
import type { ComboboxFieldProps } from './index.js';
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

const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'visualViewport');

testFieldShapedConformance({
	assertAssociation: (result) => {
		// oxlint-disable-next-line vitest/no-standalone-expect
		expect(result.locator.getByRole('combobox', { name: 'Country' }).element()).toHaveAttribute(
			'aria-describedby',
		);
	},
	getControl: (result) => {
		const control = result.locator.getByRole('combobox', { name: 'Country' }).element();
		if (!(control instanceof HTMLElement)) throw new Error('Expected a combobox input.');
		return control;
	},
	assertName: (result) => {
		// React Aria uses a hidden input for the selected form value.
		const hiddenInput = result.container.querySelector(
			'input[type="hidden"][name="conformance-field"]',
		);
		// oxlint-disable-next-line vitest/no-standalone-expect
		expect(hiddenInput).not.toBeNull();
	},
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected a combobox root.');
		return target;
	},
	name: 'ComboboxField',
	render: (props = {}) =>
		render(
			<ComboboxField<CountryItem>
				{...(props as ComboboxFieldProps<CountryItem>)}
				defaultItems={countryItems}
				description="Helpful context"
				label="Country"
			>
				{renderCountryItem}
			</ComboboxField>,
		),
});

testIntegration('ComboboxField', async () => {
	const { locator, user } = render(
		<ComboboxField defaultItems={countryItems} label="Country">
			{renderCountryItem}
		</ComboboxField>,
	);
	const input = locator.getByRole('combobox', { name: 'Country' });

	await user.click(input);
	await user.click(page.getByRole('option', { name: 'Australia' }));
	// oxlint-disable-next-line vitest/no-standalone-expect
	expect(page.getByRole('combobox', { name: 'Country' })).toHaveValue('Australia');
});

afterEach(() => {
	if (originalDescriptor) {
		Object.defineProperty(window, 'visualViewport', originalDescriptor);
	} else {
		// @ts-expect-error -- deleting a test-only own property
		delete window.visualViewport;
	}
});

test('sets the tray viewport height and keyboard inset custom properties from visualViewport', async () => {
	const fake = Object.assign(new EventTarget(), {
		height: window.innerHeight - 300,
		offsetTop: 0,
	});
	Object.defineProperty(window, 'visualViewport', { configurable: true, value: fake });

	render(
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

	expect(popover.style.getPropertyValue(comboboxTrayViewportHeightVar)).toBe(`${fake.height}px`);
	expect(popover.style.getPropertyValue(comboboxTrayKeyboardInsetVar)).toBe(
		`${window.innerHeight - fake.height}px`,
	);

	fake.height -= 100;
	fake.dispatchEvent(new Event('resize'));

	expect(popover.style.getPropertyValue(comboboxTrayViewportHeightVar)).toBe(`${fake.height}px`);
	expect(popover.style.getPropertyValue(comboboxTrayKeyboardInsetVar)).toBe(
		`${window.innerHeight - fake.height}px`,
	);
});

// A React Aria upgrade that stopped publishing these on `GroupContext` would silently stop the state selectors matching.
test('the control group carries its own disabled and invalid attributes', async () => {
	render(
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
	expect(disabledControl.dataset.disabled).toBe('true');
	expect(invalidControl.dataset.invalid).toBe('true');

	// The trigger is disabled too, but it is not what carries the group's treatment.
	expect(disabledControl.querySelector('button')?.disabled).toBe(true);
});

// React Aria disables the trigger on a read-only combobox, which must not make the control read as disabled.
test('read-only controls keep the read-only material, not the disabled one', async () => {
	render(
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
	// The group itself is not disabled, even though the trigger inside it is.
	expect(readOnlyControl.dataset.disabled).toBeUndefined();
	expect(readOnlyControl.querySelector('button')?.disabled).toBe(true);
});

test('the indicator icon adds no text to the accessible name', async () => {
	render(
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
	render(
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
	render(
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
	render(
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
	render(
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
	const { locator: scene } = render(
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
	await userEvent.click(page.getByRole('option', { name: 'Canada' }));

	expect(new FormData(form).get('country')).toBe('ca');
});

test('ComboboxField forwards onBlur to the input', async () => {
	const blurs: Array<string> = [];
	render(
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

/** The control group wrapping the combobox input labelled `name`. */
function getControl(name: string) {
	const control = page
		.getByRole('combobox', { name })
		.element()
		.closest<HTMLElement>('[role="group"]');
	if (control == null) throw new Error(`Expected a control group for the "${name}" combobox.`);
	return control;
}

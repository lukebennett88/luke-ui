import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import type { Locator } from 'vite-plus/test/context';
import { page, userEvent } from 'vite-plus/test/context';
import { testFieldShapedConformance, testIntegration } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { componentTestRegistration } from './component-test-registration.js';
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
	registration: componentTestRegistration,
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

testIntegration(componentTestRegistration, 'ComboboxField', async () => {
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

test('ComboboxField uses a mobile modal to search and select an option', async () => {
	const restoreScreenWidth = mockScreenWidth(700);
	const mobileCountryItems: Array<CountryItem> = [
		...countryItems,
		{ id: 'dk', label: 'Denmark' },
		{ id: 'fr', label: 'France' },
		{ id: 'de', label: 'Germany' },
		{ id: 'jp', label: 'Japan' },
		{ id: 'mx', label: 'Mexico' },
		{ id: 'nz', label: 'New Zealand' },
		{ id: 'sg', label: 'Singapore' },
		{ id: 'za', label: 'South Africa' },
		{ id: 'se', label: 'Sweden' },
		{ id: 'us', label: 'United States' },
	];
	try {
		const inputRef = createRef<HTMLInputElement>();
		const { container } = render(
			<>
				<div style={{ blockSize: 500 }} />
				<form aria-label="Country form" style={{ inlineSize: 'max-content' }}>
					<ComboboxField
						defaultItems={mobileCountryItems}
						defaultValue="au"
						inputRef={inputRef}
						label="Country"
						name="country"
					>
						{renderCountryItem}
					</ComboboxField>
				</form>
				<div style={{ blockSize: 800 }} />
			</>,
		);
		const form = container.querySelector('form');
		if (form == null) throw new Error('Expected the form element.');

		const trigger = page.getByRole('button', { name: 'Country' });
		const dialog = page.getByRole('dialog');
		const searchbox = page.getByRole('searchbox', { name: 'Country' });

		await expect.element(trigger).toBeVisible();
		expect(inputRef.current).toBeNull();
		const geometryFailures: Array<string> = [];

		window.scrollTo(0, 400);
		await expect.poll(() => window.scrollY).toBe(400);
		await userEvent.click(trigger);
		await expect.element(dialog).toBeVisible();
		await expect.element(searchbox).toHaveFocus();
		expect(inputRef.current).toBe(searchbox.element());
		expect(getComputedStyle(document.documentElement).overflow).toBe('hidden');

		const modal = dialog.element().parentElement;
		const overlay = modal?.parentElement;
		if (modal == null || overlay == null) {
			throw new Error('Expected the mobile modal structure.');
		}
		await expect
			.poll(() => {
				const rect = searchbox.element().getBoundingClientRect();
				return rect.top >= 0 && rect.bottom <= window.innerHeight;
			})
			.toBe(true);
		const searchboxRect = searchbox.element().getBoundingClientRect();
		const inputGroup = searchbox.element().closest<HTMLElement>('[role="group"]');
		if (inputGroup == null) throw new Error('Expected the mobile input group.');
		const inputGroupRect = inputGroup.getBoundingClientRect();
		const dialogRect = dialog.element().getBoundingClientRect();
		const borderRoundingTolerance = 1;
		if (inputGroupRect.left < dialogRect.left - borderRoundingTolerance) {
			geometryFailures.push(
				`mobile input group starts at ${inputGroupRect.left}px before tray at ${dialogRect.left}px`,
			);
		}
		if (inputGroupRect.right > dialogRect.right + borderRoundingTolerance) {
			geometryFailures.push(
				`mobile input group ends at ${inputGroupRect.right}px after tray at ${dialogRect.right}px`,
			);
		}
		const overlayTop = overlay.getBoundingClientRect().top;
		if (overlayTop !== 0) geometryFailures.push(`overlay starts at ${overlayTop}px, expected 0px`);
		if (searchboxRect.top < 0 || searchboxRect.bottom > window.innerHeight) {
			geometryFailures.push(
				`tray searchbox spans ${searchboxRect.top}px to ${searchboxRect.bottom}px outside a ${window.innerHeight}px viewport`,
			);
		}
		expect(geometryFailures).toEqual([]);

		// RAC's own `Modal` sets `--visual-viewport-height` from `useViewportSize`, standing in for
		// the keyboard shrinking the visual viewport. `mobileModal` must spend the shrunk amount on
		// `paddingBlockEnd`, not on `blockSize`, so the sheet keeps its full height above the
		// keyboard instead of shrinking. Wait for `data-entering` to clear first: the rect is
		// unreliable mid-transition, and only entry animates position, not this padding swap.
		await expect.poll(() => modal.hasAttribute('data-entering')).toBe(false);
		overlay.style.setProperty('--visual-viewport-height', '500px');

		const space800 = Number.parseFloat(
			getComputedStyle(document.documentElement).getPropertyValue('--luke-space-800'),
		);
		const fullViewportHeight = window.innerHeight;
		const forcedViewportHeight = 500;
		const expectedBlockSize = forcedViewportHeight - space800;
		const expectedPaddingBlockEnd =
			Math.max(fullViewportHeight - forcedViewportHeight, 0) + fullViewportHeight;
		expect(Number.parseFloat(getComputedStyle(modal).height)).toBeCloseTo(expectedBlockSize, 1);
		expect(Number.parseFloat(getComputedStyle(modal).paddingBottom)).toBeCloseTo(
			expectedPaddingBlockEnd,
			1,
		);

		const listbox = page.getByRole('listbox').element();
		const pageScrollY = window.scrollY;
		listbox.scrollTo(0, listbox.scrollHeight);
		await expect.poll(() => listbox.scrollTop).toBeGreaterThan(0);
		expect(window.scrollY).toBe(pageScrollY);

		await expect.element(page.getByRole('option', { name: 'Australia' })).toBeInTheDocument();
		const canada = page.getByRole('option', { name: 'Canada' });
		listbox.scrollTo(0, 0);
		await expect.poll(() => listbox.scrollTop).toBe(0);
		await expect
			.poll(() => canada.element().getBoundingClientRect().top)
			.toBeGreaterThanOrEqual(listbox.getBoundingClientRect().top);
		await expect
			.poll(() => canada.element().getBoundingClientRect().bottom)
			.toBeLessThanOrEqual(listbox.getBoundingClientRect().bottom);
		await userEvent.click(canada);

		await expect.poll(() => new FormData(form).get('country')).toBe('ca');
		await expect.element(dialog).not.toBeInTheDocument();
		await expect.element(trigger).toHaveFocus();
		expect(inputRef.current).toBeNull();
	} finally {
		window.scrollTo(0, 0);
		restoreScreenWidth();
	}
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
	const restoreScreenWidth = mockScreenWidth(700);
	try {
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

		const readOnlyControl = page
			.getByRole('button', { name: 'Read-only' })
			.element()
			.closest<HTMLElement>('[role="group"]');
		if (readOnlyControl == null) throw new Error('Expected the read-only control group.');
		// The group itself is not disabled, even though the trigger inside it is.
		expect(readOnlyControl.dataset.disabled).toBeUndefined();
		expect(readOnlyControl.querySelector('button')?.disabled).toBe(true);
	} finally {
		restoreScreenWidth();
	}
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

	const option = page.getByRole('option', { name: 'Canada' });
	await expect.element(option).toBeInTheDocument();

	await waitForTrayToSettle(option);
	await userEvent.click(option);

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

function mockScreenWidth(width: number) {
	const descriptor = Object.getOwnPropertyDescriptor(window.screen, 'width');
	Object.defineProperty(window.screen, 'width', { configurable: true, value: width });

	return () => {
		if (descriptor == null) {
			Reflect.deleteProperty(window.screen, 'width');
			return;
		}
		Object.defineProperty(window.screen, 'width', descriptor);
	};
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

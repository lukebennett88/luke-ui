import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { testFieldShapedConformance, testIntegration } from '../conformance/helpers.js';
import { ComboboxInputGroup } from '../primitives/combobox/input-group.js';
import { ComboboxInput } from '../primitives/combobox/input.js';
import { ComboboxItem } from '../primitives/combobox/item.js';
import { ComboboxRoot } from '../primitives/combobox/root.js';
import { mockScreenWidth } from '../test-utils/mock-screen-width.js';
import { render } from '../test-utils/render.js';
import { waitForOverlayEnter } from '../test-utils/wait-for-overlay-enter.js';
import { ComboboxField } from './index.js';

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
	assertName: (result) => {
		// React Aria uses a hidden input for the selected form value.
		const hiddenInput = result.container.querySelector(
			'input[type="hidden"][name="conformance-field"]',
		);
		// oxlint-disable-next-line vitest/no-standalone-expect
		expect(hiddenInput).not.toBeNull();
	},
	getControl: (result) => {
		const control = result.locator.getByRole('combobox', { name: 'Country' }).element();
		if (!(control instanceof HTMLElement)) throw new Error('Expected a combobox input.');
		return control;
	},
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected a combobox root.');
		return target;
	},
	path: 'combobox-field',
	render: (props = {}) => {
		return render(
			<ComboboxField<CountryItem>
				{...props}
				defaultItems={countryItems}
				description="Helpful context"
				label="Country"
			>
				{renderCountryItem}
			</ComboboxField>,
		);
	},
});

testIntegration('combobox-field', async () => {
	const { locator, user } = render(
		<ComboboxField defaultItems={countryItems} label="Country">
			{renderCountryItem}
		</ComboboxField>,
	);
	const input = locator.getByRole('combobox', { name: 'Country' });

	await user.click(input);

	const option = page.getByRole('option', { name: 'Australia' });
	// oxlint-disable-next-line vitest/no-standalone-expect
	await expect.element(option).toBeInTheDocument();
	// Clicking an option scrolls it into view first, and React Aria closes the popover on a
	// document scroll. While the popover is still entering, that close lands before the click and
	// detaches the option.
	const popover = page.getByRole('listbox').element().parentElement;
	if (popover == null) throw new Error('Expected the popover element.');
	await waitForOverlayEnter(popover);

	await user.click(option);
	// oxlint-disable-next-line vitest/no-standalone-expect
	expect(page.getByRole('combobox', { name: 'Country' })).toHaveValue('Australia');
});

test('ComboboxField uses a mobile modal to search and select an option', async () => {
	const restoreScreenWidth = mockScreenWidth(390);
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

		// The mobile composition renders a value button where the desktop one renders a text input.
		await expect.element(trigger).toBeVisible();
		expect(inputRef.current).toBeNull();

		window.scrollTo(0, 400);
		await expect.poll(() => window.scrollY).toBe(400);
		await userEvent.click(trigger);
		await expect.element(dialog).toBeVisible();
		expect(inputRef.current).toBe(searchbox.element());
		// Luke UI deliberately moved this overlay from a non-modal popover to a modal, so the page
		// behind the tray must stop scrolling while it is open.
		expect(getComputedStyle(document.documentElement).overflow).toBe('hidden');

		const modal = dialog.element().parentElement;
		const overlay = modal?.parentElement;
		if (modal == null || overlay == null) {
			throw new Error('Expected the mobile modal structure.');
		}

		// Measuring the tray only means anything once it has stopped sliding up.
		await waitForOverlayEnter(overlay);

		// RAC's own `Modal` sets `--visual-viewport-height` from `useViewportSize`, so overriding it
		// stands in for the keyboard shrinking the visual viewport. `mobileModal` must take the shrunk
		// amount off `blockSize` and spend it on `paddingBlockEnd`, so the sheet keeps its content above
		// the keyboard. Every expectation is measured at runtime, so none pins a resolved spacing value.
		// A soft keyboard commonly covers about half the viewport, and taking that much away also leaves
		// the option list taller than the tray, so the scroll check below has something to scroll.
		const restingViewportHeight = window.innerHeight;
		const keyboardInset = Math.round(restingViewportHeight / 2);
		overlay.style.setProperty('--visual-viewport-height', `${restingViewportHeight}px`);
		const trayTop = modal.getBoundingClientRect().top;
		const restingBlockSize = Number.parseFloat(getComputedStyle(modal).height);
		const restingPaddingBlockEnd = Number.parseFloat(getComputedStyle(modal).paddingBottom);
		// The tray's content box runs from its top offset to the bottom of the visual viewport.
		expect(restingBlockSize + trayTop).toBeCloseTo(restingViewportHeight, 1);

		overlay.style.setProperty(
			'--visual-viewport-height',
			`${restingViewportHeight - keyboardInset}px`,
		);
		expect(Number.parseFloat(getComputedStyle(modal).height) + trayTop).toBeCloseTo(
			restingViewportHeight - keyboardInset,
			1,
		);
		expect(Number.parseFloat(getComputedStyle(modal).paddingBottom)).toBeCloseTo(
			restingPaddingBlockEnd + keyboardInset,
			1,
		);

		// The rest of the journey runs with the keyboard still up, which is how someone picks an
		// option after typing.
		const listbox = page.getByRole('listbox').element();
		const pageScrollY = window.scrollY;
		listbox.scrollTo(0, listbox.scrollHeight);
		await expect.poll(() => listbox.scrollTop).toBeGreaterThan(0);
		// Scrolling the tray's list must not chain out to the page behind it.
		expect(window.scrollY).toBe(pageScrollY);

		const canada = page.getByRole('option', { name: 'Canada' });
		listbox.scrollTo(0, 0);
		await expect.poll(() => listbox.scrollTop).toBe(0);
		await userEvent.click(canada);

		await expect.poll(() => new FormData(form).get('country')).toBe('ca');
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

	expect(getControl('Disabled').dataset.disabled).toBe('true');
	expect(getControl('Invalid').dataset.invalid).toBe('true');
});

// React Aria disables the trigger on a read-only combobox, which must not make the control read as disabled.
test('read-only controls keep the read-only material, not the disabled one', async () => {
	const restoreScreenWidth = mockScreenWidth(390);
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

// The primitive renders the control itself, so it takes a plain `ref`.
test('ComboboxInput resolves object and callback refs to the input element', async () => {
	const objectRef = createRef<HTMLInputElement>();
	const callbackResolved: Array<HTMLInputElement | null> = [];
	render(
		<>
			<ComboboxRoot<CountryItem> aria-label="Country object" defaultItems={countryItems}>
				<ComboboxInputGroup>
					<ComboboxInput ref={objectRef} />
				</ComboboxInputGroup>
			</ComboboxRoot>
			<ComboboxRoot<CountryItem> aria-label="Country callback" defaultItems={countryItems}>
				<ComboboxInputGroup>
					<ComboboxInput
						ref={(node) => {
							callbackResolved.push(node);
						}}
					/>
				</ComboboxInputGroup>
			</ComboboxRoot>
		</>,
	);

	const objectInput = page.getByRole('combobox', { name: 'Country object' });
	const callbackInput = page.getByRole('combobox', { name: 'Country callback' });
	await expect.element(objectInput).toBeVisible();
	await expect.element(callbackInput).toBeVisible();

	expect(objectRef.current).toBe(objectInput.element());
	expect(callbackResolved.at(-1)).toBe(callbackInput.element());
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

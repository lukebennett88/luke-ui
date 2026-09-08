import { createRef, useState } from 'react';
import type { Key } from 'react-aria-components/ComboBox';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { testConformance, testIntegration } from '../conformance/helpers.js';
import { ComboboxInputGroup } from '../primitives/combobox/input-group.js';
import { ComboboxInput } from '../primitives/combobox/input.js';
import { ComboboxItem } from '../primitives/combobox/item.js';
import { ComboboxRoot } from '../primitives/combobox/root.js';
import { mockScreenWidth } from '../test-utils/mock-screen-width.js';
import { render } from '../test-utils/render.js';
import { waitForOverlayEnter } from '../test-utils/wait-for-overlay-enter.js';
import { ComboboxField } from './combobox-field.js';

type CountryItem = {
	id: string;
	label: string;
};

const countryItems: Array<CountryItem> = [
	{ id: 'au', label: 'Australia' },
	{ id: 'ca', label: 'Canada' },
];

const renderCountryItem = (item: CountryItem) => <ComboboxItem>{item.label}</ComboboxItem>;

testConformance({
	path: 'combobox-field',
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
		const control = result.locator.getByRole('combobox', { name: 'Country' }).element();
		if (!(control instanceof HTMLElement)) throw new Error('Expected a combobox input.');
		// RAC mounts a collection `<template>` before the ComboBox root, so
		// `container.firstElementChild` is not the className host. Walk to the
		// outermost `data-rac` ancestor of the control instead.
		let target: HTMLElement | null = null;
		for (
			let node: HTMLElement | null = control;
			node != null && node !== result.container;
			node = node.parentElement
		) {
			if (node.hasAttribute('data-rac')) target = node;
		}
		if (target == null) throw new Error('Expected a ComboboxField root.');
		return target;
	},
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
	try {
		const inputRef = createRef<HTMLInputElement>();
		const { container } = render(
			<form aria-label="Country form" style={{ inlineSize: 'max-content' }}>
				<ComboboxField
					defaultItems={countryItems}
					defaultValue="au"
					inputRef={inputRef}
					label="Country"
					name="country"
				>
					{renderCountryItem}
				</ComboboxField>
			</form>,
		);
		const form = container.querySelector('form');
		if (form == null) throw new Error('Expected the form element.');

		const trigger = page.getByRole('button', { name: 'Country' });
		const dialog = page.getByRole('dialog');
		const searchbox = page.getByRole('searchbox', { name: 'Country' });

		// The mobile composition renders a value button where the desktop one renders a text input.
		expect(inputRef.current).toBeNull();

		await userEvent.click(trigger);
		await expect.element(dialog).toBeVisible();
		expect(inputRef.current).toBe(searchbox.element());

		const modal = dialog.element().parentElement;
		const overlay = modal?.parentElement;
		if (modal == null || overlay == null) {
			throw new Error('Expected the mobile modal structure.');
		}

		// Measuring the tray only means anything once it has stopped sliding up.
		await waitForOverlayEnter(overlay);

		expect(getComputedStyle(overlay).top).toBe(`${window.scrollY}px`);

		// RAC's own `Modal` sets `--visual-viewport-height` from `useViewportSize`, so overriding it
		// stands in for the keyboard shrinking the visual viewport. `mobileModal` must take the shrunk
		// amount off `blockSize` and spend it on `paddingBlockEnd`, so the sheet keeps its content above
		// the keyboard. Every expectation is measured at runtime, so none pins a resolved spacing value.
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

		const listbox = page.getByRole('listbox').element();
		// Programmatic `element.scrollTo()` does not exercise scroll chaining. Browser-computed
		// overscroll-behavior is the Luke UI-owned contract (`mobileListBox`).
		expect(getComputedStyle(listbox).overscrollBehavior).toBe('contain');

		await userEvent.click(page.getByRole('option', { name: 'Canada' }));

		await expect.poll(() => new FormData(form).get('country')).toBe('ca');
	} finally {
		restoreScreenWidth();
	}
});

// The primitive renders the control itself, so it takes a plain `ref`.
test('ComboboxInput resolves object and callback refs to the input element', () => {
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

	expect(objectRef.current).toBe(objectInput.element());
	expect(callbackResolved.at(-1)).toBe(callbackInput.element());
});

test('ComboboxField reopens the popover when the focused input is clicked again', async () => {
	const { locator } = render(
		<ComboboxField defaultItems={countryItems} label="Country">
			{renderCountryItem}
		</ComboboxField>,
	);
	const input = locator.getByRole('combobox', { name: 'Country' }).element() as HTMLElement;

	await userEvent.click(input);
	await expect.element(page.getByRole('option', { name: 'Australia' })).toBeVisible();

	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
	expect(document.activeElement).toBe(input);

	await userEvent.click(input);
	await expect.element(page.getByRole('option', { name: 'Australia' })).toBeVisible();
});

test('ComboboxField clearing the tray search clears the selection', async () => {
	const restoreScreenWidth = mockScreenWidth(390);
	try {
		const { container } = render(
			<form aria-label="Country form">
				<ComboboxField defaultItems={countryItems} defaultValue="au" label="Country" name="country">
					{renderCountryItem}
				</ComboboxField>
			</form>,
		);
		const form = container.querySelector('form');
		if (form == null) throw new Error('Expected the form element.');

		const trigger = page.getByRole('button', { name: 'Country Australia' }).element();
		await userEvent.click(trigger);
		await expect.element(page.getByRole('dialog')).toBeVisible();

		await userEvent.click(page.getByRole('button', { name: 'Clear search' }).element());
		await userEvent.keyboard('{Escape}');
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

		expect(new FormData(form).get('country')).toBe('');
		await expect.element(trigger).toHaveTextContent('');
	} finally {
		restoreScreenWidth();
	}
});

test('ComboboxField tray clear clears a controlled selection and inputValue', async () => {
	const restoreScreenWidth = mockScreenWidth(390);
	try {
		const changes: Array<Key | null> = [];
		const inputChanges: Array<string> = [];

		function ControlledTrayCombobox() {
			const [value, setValue] = useState<Key | null>('au');
			const [inputValue, setInputValue] = useState('Australia');
			return (
				<form aria-label="Country form">
					<ComboboxField
						defaultItems={countryItems}
						inputValue={inputValue}
						label="Country"
						name="country"
						onChange={(next) => {
							changes.push(next);
							setValue(next);
						}}
						onInputChange={(next) => {
							inputChanges.push(next);
							setInputValue(next);
						}}
						value={value}
					>
						{renderCountryItem}
					</ComboboxField>
				</form>
			);
		}

		const { container } = render(<ControlledTrayCombobox />);
		const form = container.querySelector('form');
		if (form == null) throw new Error('Expected the form element.');

		await userEvent.click(page.getByRole('button', { name: 'Country Australia' }).element());
		await expect.element(page.getByRole('dialog')).toBeVisible();
		await expect.element(page.getByRole('searchbox', { name: 'Country' })).toHaveValue('Australia');

		await userEvent.click(page.getByRole('button', { name: 'Clear search' }).element());
		await expect.element(page.getByRole('searchbox', { name: 'Country' })).toHaveValue('');
		await userEvent.keyboard('{Escape}');
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

		expect(changes).toEqual([null]);
		expect(inputChanges).toContain('');
		expect(new FormData(form).get('country')).toBe('');
		await expect.element(page.getByRole('button', { name: 'Country' })).toHaveTextContent('');
	} finally {
		restoreScreenWidth();
	}
});

test('ComboboxField clear selection empties the desktop field', async () => {
	const { locator } = render(
		<ComboboxField defaultItems={countryItems} defaultValue="au" label="Country">
			{renderCountryItem}
		</ComboboxField>,
	);
	const input = locator.getByRole('combobox', { name: 'Country' });
	await expect.element(input).toHaveValue('Australia');

	await userEvent.click(page.getByRole('button', { name: 'Clear selection' }).element());
	await expect.element(input).toHaveValue('');
});

test('ComboboxField reports a selection the parent had already moved away from', async () => {
	const restoreScreenWidth = mockScreenWidth(390);
	try {
		const changes: Array<Key | null> = [];
		function ControlledCombobox() {
			const [value, setValue] = useState<Key | null>('au');
			return (
				<>
					<button onClick={() => setValue('ca')} type="button">
						Move selection
					</button>
					<ComboboxField
						defaultItems={countryItems}
						label="Country"
						onChange={(next) => {
							changes.push(next);
							setValue(next);
						}}
						value={value}
					>
						{renderCountryItem}
					</ComboboxField>
				</>
			);
		}
		render(<ControlledCombobox />);

		await userEvent.click(page.getByRole('button', { name: 'Move selection' }).element());
		await expect.element(page.getByRole('button', { name: 'Country Canada' })).toBeVisible();
		expect(changes).toEqual([]);

		await userEvent.click(page.getByRole('button', { name: 'Country Canada' }).element());
		await userEvent.click(page.getByRole('option', { name: 'Australia' }).element());
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

		expect(changes).toEqual(['au']);
		await expect.element(page.getByRole('button', { name: 'Country Australia' })).toBeVisible();
	} finally {
		restoreScreenWidth();
	}
});

test('ComboboxField keeps a controlled selection cleared by the parent', async () => {
	const restoreScreenWidth = mockScreenWidth(390);
	try {
		function ControlledCombobox() {
			const [value, setValue] = useState<Key | null>('au');
			return (
				<>
					<button onClick={() => setValue(null)} type="button">
						Reset from outside
					</button>
					<ComboboxField
						defaultItems={countryItems}
						label="Country"
						onChange={setValue}
						placeholder="Select a country"
						value={value}
					>
						{renderCountryItem}
					</ComboboxField>
				</>
			);
		}
		render(<ControlledCombobox />);

		await userEvent.click(page.getByRole('button', { name: 'Reset from outside' }).element());
		await expect
			.element(page.getByRole('button', { name: 'Country Select a country' }))
			.toBeVisible();

		await userEvent.click(page.getByRole('button', { name: 'Country Select a country' }).element());
		await expect.element(page.getByRole('dialog')).toBeVisible();
		await expect.element(page.getByRole('searchbox', { name: 'Country' })).toHaveValue('');

		await userEvent.keyboard('{Escape}');
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Country Select a country' }))
			.toBeVisible();
	} finally {
		restoreScreenWidth();
	}
});

test('ComboboxField clears the selection when a query replaces it without picking an option', async () => {
	const restoreScreenWidth = mockScreenWidth(390);
	try {
		const changes: Array<Key | null> = [];
		render(
			<ComboboxField
				defaultItems={countryItems}
				defaultValue="au"
				label="Country"
				onChange={(next) => changes.push(next)}
			>
				{renderCountryItem}
			</ComboboxField>,
		);

		const trigger = page.getByRole('button', { name: 'Country Australia' }).element();
		await userEvent.click(trigger);
		const search = page.getByRole('searchbox', { name: 'Country' }).element();
		await userEvent.clear(search);
		await userEvent.type(search, 'Can');
		await userEvent.keyboard('{Escape}');
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

		expect(changes).toEqual([null]);
		await expect.element(trigger).toHaveTextContent('');
	} finally {
		restoreScreenWidth();
	}
});

test('ComboboxField leaves a consumer-controlled inputValue authoritative', async () => {
	const { locator } = render(
		<ComboboxField defaultItems={countryItems} inputValue="Aus" label="Country">
			{renderCountryItem}
		</ComboboxField>,
	);
	const input = locator.getByRole('combobox', { name: 'Country' });
	await expect.element(input).toHaveValue('Aus');

	await userEvent.click(page.getByRole('button', { name: 'Toggle options' }).element());
	await userEvent.click(page.getByRole('option', { name: 'Australia' }).element());
	await expect.element(input).toHaveValue('Aus');
});

test('ComboboxField clears the selection when the desktop input is emptied', async () => {
	const changes: Array<Key | null> = [];
	const { container, locator } = render(
		<form aria-label="Country form">
			<ComboboxField
				defaultItems={countryItems}
				defaultValue="au"
				label="Country"
				name="country"
				onChange={(next) => changes.push(next)}
			>
				{renderCountryItem}
			</ComboboxField>
		</form>,
	);
	const form = container.querySelector('form');
	if (form == null) throw new Error('Expected the form element.');
	const input = locator.getByRole('combobox', { name: 'Country' });
	await expect.element(input).toHaveValue('Australia');

	await userEvent.clear(input.element());
	await userEvent.keyboard('{Escape}');

	expect(new FormData(form).get('country')).toBe('');
	expect(changes).toEqual([null]);
	await expect.element(input).toHaveValue('');
});

test('ComboboxField seeds the desktop input from defaultInputValue', async () => {
	const { locator } = render(
		<ComboboxField defaultInputValue="Aus" defaultItems={countryItems} label="Country">
			{renderCountryItem}
		</ComboboxField>,
	);

	await expect.element(locator.getByRole('combobox', { name: 'Country' })).toHaveValue('Aus');
});

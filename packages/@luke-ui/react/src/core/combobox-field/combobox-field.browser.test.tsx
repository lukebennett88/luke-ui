import { ComboboxField } from '@luke-ui/react/combobox-field';
import { Icon } from '@luke-ui/react/icon';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import {
	ComboboxInput,
	ComboboxInputGroup,
	ComboboxItem,
	ComboboxListBox,
	ComboboxLoadMoreItem,
	ComboboxPopover,
	ComboboxRoot,
	ComboboxSection,
	ComboboxTrigger,
} from '@luke-ui/react/primitives/combobox';
import { Field } from '@luke-ui/react/primitives/field';
import { createRef, useState } from 'react';
import type { Key } from 'react-aria-components/ComboBox';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { mockScreenWidth } from '../test-utils/mock-screen-width.js';
import { render, visualAppearances } from '../test-utils/render.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
	Stack,
} from '../test-utils/visual.js';
import { waitForOverlayEnter } from '../test-utils/wait-for-overlay-enter.js';

type CountryItem = {
	id: string;
	label: string;
};

const countryItems: Array<CountryItem> = [
	{ id: 'au', label: 'Australia' },
	{ id: 'ca', label: 'Canada' },
];

/** The longer list the representative scene and the visual captures lay out. */
const sceneCountryItems: Array<CountryItem> = [
	{ id: 'au', label: 'Australia' },
	{ id: 'ca', label: 'Canada' },
	{ id: 'nz', label: 'New Zealand' },
	{ id: 'us', label: 'United States' },
	{ id: 'se', label: 'Sweden' },
];

const renderCountryItem = (item: CountryItem) => <ComboboxItem>{item.label}</ComboboxItem>;

const renderIconItem = (item: CountryItem) => (
	<ComboboxItem>
		<Icon name="bookOpen" />
		{item.label}
	</ComboboxItem>
);

// RAC moves `id` onto the control, and mounts a collection `<template>` before
// the ComboBox root, so `className`/`data-*` land on neither `container.firstElementChild`
// nor the element carrying `id`.
test('ComboboxField forwards className and data attributes to its root, and id to the DOM', () => {
	const { container } = render(
		<ComboboxField<CountryItem>
			className="forwarded-class"
			data-forwarded="true"
			defaultItems={countryItems}
			description="Helpful context"
			id="forwarded-id"
			label="Country"
		>
			{renderCountryItem}
		</ComboboxField>,
	);
	const root = container.querySelector('[data-forwarded="true"]');
	if (!(root instanceof HTMLElement)) throw new Error('Expected a ComboboxField root.');

	expect(root).toHaveClass('forwarded-class');
	expect(container.querySelector('#forwarded-id')).not.toBeNull();
});

test('ComboboxField resolves inputRef to the input, submits its value, and fires onBlur', () => {
	const inputRef = createRef<HTMLInputElement>();
	let blurred = false;
	const { container, locator } = render(
		<ComboboxField<CountryItem>
			defaultItems={countryItems}
			description="Helpful context"
			inputRef={inputRef}
			label="Country"
			name="country"
			onBlur={() => {
				blurred = true;
			}}
		>
			{renderCountryItem}
		</ComboboxField>,
	);
	const control = locator.getByRole('combobox', { name: 'Country' }).element();

	expect(inputRef.current).toBe(control);
	// The description is wired to the combobox, not just rendered beside it.
	expect(control).toHaveAttribute('aria-describedby');
	// React Aria carries the selected form value on a hidden input, not on the
	// visible combobox, so that is the control a form reads.
	expect(container.querySelector('input[type="hidden"][name="country"]')).not.toBeNull();

	const form = document.createElement('form');
	container.replaceWith(form);
	form.append(container);
	const namedControl = form.elements.namedItem('country');
	if (!(namedControl instanceof HTMLInputElement)) {
		throw new Error('Expected a native input named country.');
	}
	namedControl.value = 'au';
	expect(new FormData(form).get('country')).toBe('au');

	if (!(control instanceof HTMLElement)) throw new Error('Expected an HTML control.');
	control.focus();
	control.blur();
	expect(blurred).toBe(true);

	form.remove();
});

// React Aria types `inputRef` as a ref object. Luke UI widens it to accept a
// callback so React Hook Form's `field.ref` works without an adapter.
test('ComboboxField resolves a callback inputRef to the input', () => {
	const resolved: Array<HTMLElement | null> = [];
	const { locator } = render(
		<ComboboxField<CountryItem>
			defaultItems={countryItems}
			inputRef={(node: HTMLElement | null) => {
				resolved.push(node);
			}}
			label="Country"
			name="country"
		>
			{renderCountryItem}
		</ComboboxField>,
	);
	const control = locator.getByRole('combobox', { name: 'Country' }).element();

	expect(resolved.at(-1)).toBe(control);
});

test('picking an option from the ComboboxField popover fills the input', async () => {
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
	expect(page.getByRole('combobox', { name: 'Country' })).toHaveValue('Australia');
});

test('the ComboboxField scene has no axe violations', async () => {
	const { container } = render(
		<Stack>
			<ComboboxField
				defaultItems={sceneCountryItems}
				label="Resting"
				name="resting"
				placeholder="Select a country..."
			>
				{renderCountryItem}
			</ComboboxField>
			<ComboboxField
				defaultItems={sceneCountryItems}
				description="Pick where you are based."
				label="With description"
				name="described"
			>
				{renderCountryItem}
			</ComboboxField>
			<ComboboxField
				defaultItems={sceneCountryItems}
				errorMessage="Choose a country."
				label="Invalid"
				name="invalid"
			>
				{renderCountryItem}
			</ComboboxField>
			<ComboboxField defaultItems={sceneCountryItems} isDisabled label="Disabled" name="disabled">
				{renderCountryItem}
			</ComboboxField>
		</Stack>,
	);

	await expectNoAxeViolations(container);
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

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<Stack>
				<ComboboxField
					defaultItems={sceneCountryItems}
					label="Resting"
					name="resting"
					placeholder="Select a country..."
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={sceneCountryItems}
					defaultValue="ca"
					isDisabled
					label="Disabled"
					name="disabled"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={sceneCountryItems}
					defaultValue="ca"
					isReadOnly
					label="Read-only"
					name="readonly"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={sceneCountryItems}
					errorMessage="Choose a valid country."
					label="Invalid"
					name="invalid"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={sceneCountryItems}
					defaultValue="ca"
					errorMessage="Choose a different country."
					label="Invalid with a selection"
					name="invalid-with-selection"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxRoot defaultItems={sceneCountryItems} isInvalid name="invalid-no-message">
					<Field label="Invalid, no message">
						<ComboboxInputGroup>
							<ComboboxInput placeholder="Select a country..." />
							<ComboboxTrigger aria-label="Toggle options">
								<Icon name="chevronDown" />
							</ComboboxTrigger>
						</ComboboxInputGroup>
						<ComboboxPopover offset={4}>
							<ComboboxListBox>{renderCountryItem}</ComboboxListBox>
						</ComboboxPopover>
					</Field>
				</ComboboxRoot>
				<ComboboxField
					defaultItems={sceneCountryItems}
					defaultValue="ca"
					errorMessage="Choose a different country."
					label="Invalid small"
					name="invalid-small"
					size="small"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={sceneCountryItems}
					label="Small"
					name="small"
					placeholder="Small"
					size="small"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={sceneCountryItems}
					label="Medium"
					name="medium"
					placeholder="Medium"
					size="medium"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxRoot
					defaultItems={sceneCountryItems}
					name="small-group-medium-trigger"
					size="small"
				>
					<Field label="Small group, medium trigger">
						<ComboboxInputGroup>
							<ComboboxInput placeholder="Select a country..." />
							<ComboboxTrigger aria-label="Toggle medium trigger" size="medium">
								<Icon name="chevronDown" />
							</ComboboxTrigger>
						</ComboboxInputGroup>
						<ComboboxPopover offset={4}>
							<ComboboxListBox>{renderCountryItem}</ComboboxListBox>
						</ComboboxPopover>
					</Field>
				</ComboboxRoot>
			</Stack>,
			{ appearance },
		);
		await captureVisualAppearance(locator, 'combobox-field/kitchen-sink', appearance);
	}
});

test('interactive states', { tags: ['visual'] }, async () => {
	const { locator } = render(
		<ComboboxField
			defaultItems={sceneCountryItems}
			defaultValue="ca"
			label="Country"
			name="country"
		>
			{renderCountryItem}
		</ComboboxField>,
	);
	const input = page.getByRole('combobox', { name: 'Country' });
	const clear = page.getByRole('button', { name: 'Clear selection' });
	const trigger = page.getByRole('button', { name: 'Toggle options' });

	await userEvent.hover(input);
	await captureVisual(locator, 'combobox-field/hover');
	await userEvent.unhover(input);
	await userEvent.hover(clear);
	await captureVisual(locator, 'combobox-field/clear-hover');
	await userEvent.unhover(clear);
	await userEvent.hover(trigger);
	await captureVisual(locator, 'combobox-field/trigger-hover');
	await userEvent.unhover(trigger);
	await focusViaKeyboard(input);
	await captureVisual(locator, 'combobox-field/focus-visible');
	await userEvent.tab();
	await captureVisual(locator, 'combobox-field/clear-focus-visible');
	await userEvent.keyboard('{Space>}');
	await captureVisual(locator, 'combobox-field/clear-pressed');
	await userEvent.keyboard('{/Space}');
});

test('open option and selection states', { tags: ['visual'] }, async () => {
	render(
		<ComboboxField
			defaultItems={sceneCountryItems}
			defaultValue="ca"
			disabledKeys={['se']}
			label="Country"
			loadMoreItem={
				<ComboboxLoadMoreItem isLoading>
					<LoadingSpinner aria-label="Loading more options..." size="small" />
				</ComboboxLoadMoreItem>
			}
			name="country"
		>
			{renderCountryItem}
		</ComboboxField>,
	);
	const input = page.getByRole('combobox', { name: 'Country' });

	await userEvent.click(input);
	await captureVisual(
		page.elementLocator(document.body),
		'combobox-field/open-selected-disabled-loading',
	);
	await userEvent.keyboard('{Home}');
	await captureVisual(page.elementLocator(document.body), 'combobox-field/option-keyboard-focus');
});

test('option with leading icon at both sizes', { tags: ['visual'] }, async () => {
	render(
		<Stack>
			<ComboboxField defaultItems={sceneCountryItems} label="Medium" name="medium">
				{renderIconItem}
			</ComboboxField>
			<ComboboxField defaultItems={sceneCountryItems} label="Small" name="small" size="small">
				{renderIconItem}
			</ComboboxField>
		</Stack>,
	);
	await userEvent.click(page.getByRole('combobox', { name: 'Medium' }));
	await captureVisual(
		page.elementLocator(document.body),
		'combobox-field/option-leading-icon-medium',
	);
	await userEvent.keyboard('{Escape}');
	await userEvent.click(page.getByRole('combobox', { name: 'Small' }));
	await captureVisual(
		page.elementLocator(document.body),
		'combobox-field/option-leading-icon-small',
	);
});

test('mobile tray', { tags: ['visual'] }, async () => {
	await page.viewport(390, 700);
	const restoreScreenWidth = mockScreenWidth(390);
	try {
		render(
			<Stack>
				<ComboboxField
					defaultItems={sceneCountryItems}
					description="Select where the user is located."
					label="Country"
					name="country"
					placeholder="Select a country..."
				>
					{renderCountryItem}
				</ComboboxField>
			</Stack>,
		);
		await userEvent.click(page.getByRole('button', { name: 'Country' }));
		await waitForMobileTrayToSettle();
		await captureVisual(page.elementLocator(document.body), 'combobox-field/tray');
	} finally {
		restoreScreenWidth();
		await page.viewport(1024, 800);
	}
});

test('mobile tray short list', { tags: ['visual'] }, async () => {
	await page.viewport(390, 700);
	const restoreScreenWidth = mockScreenWidth(390);
	try {
		render(
			<Stack>
				<ComboboxField
					defaultItems={sceneCountryItems.slice(0, 2)}
					description="Select where the user is located."
					label="Country"
					name="country"
					placeholder="Select a country..."
				>
					{renderCountryItem}
				</ComboboxField>
			</Stack>,
		);
		await userEvent.click(page.getByRole('button', { name: 'Country' }));
		await waitForMobileTrayToSettle();
		await captureVisual(page.elementLocator(document.body), 'combobox-field/tray-short');
	} finally {
		restoreScreenWidth();
		await page.viewport(1024, 800);
	}
});

test('forced-colors states', { tags: ['visual'] }, async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Stack>
				<ComboboxField
					defaultItems={sceneCountryItems}
					defaultValue="ca"
					disabledKeys={['se']}
					label="Interactive"
					name="interactive"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={sceneCountryItems}
					defaultValue="ca"
					isDisabled
					label="Disabled"
					name="disabled"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={sceneCountryItems}
					defaultValue="ca"
					isReadOnly
					label="Read-only"
					name="readonly"
				>
					{renderCountryItem}
				</ComboboxField>
				<ComboboxField
					defaultItems={sceneCountryItems}
					errorMessage="Choose a valid country."
					label="Invalid"
					name="invalid"
				>
					{renderCountryItem}
				</ComboboxField>
			</Stack>,
		);
		const input = page.getByRole('combobox', { name: 'Interactive' });
		const trigger = page.getByRole('button', { name: 'Toggle options' }).first();

		await captureVisual(locator, 'combobox-field/forced-colors-resting-states');
		await userEvent.hover(trigger);
		await captureVisual(locator, 'combobox-field/forced-colors-trigger-hover');
		await userEvent.unhover(trigger);
		await focusViaKeyboard(input);
		await captureVisual(locator, 'combobox-field/forced-colors-focus-visible');
		await userEvent.keyboard('{ArrowDown}{Home}');
		await captureVisual(
			page.elementLocator(document.body),
			'combobox-field/forced-colors-open-options',
		);
		await userEvent.keyboard('{Escape}');
	} finally {
		await emulateForcedColors('none');
	}
});

test('rich section title', { tags: ['visual'] }, async () => {
	render(
		<Stack width="14rem">
			<ComboboxField label="Country" name="grouped-rich" placeholder="Select a country...">
				<ComboboxSection
					id="north"
					title={
						<>
							Northern <strong>hemisphere</strong> countries and <em>territories</em>
						</>
					}
				>
					<ComboboxItem id="ca">Canada</ComboboxItem>
					<ComboboxItem id="us">United States</ComboboxItem>
				</ComboboxSection>
			</ComboboxField>
		</Stack>,
	);

	await userEvent.click(page.getByRole('combobox', { name: 'Country' }));
	await captureVisual(
		page.elementLocator(document.body),
		'combobox-field/section-title-rich-content',
	);
});

/**
 * Waits for the tray to finish opening before a capture. The screenshot owns the resting geometry,
 * so nothing here measures a position.
 */
async function waitForMobileTrayToSettle() {
	const dialog = page.getByRole('dialog');
	await expect.element(dialog).toBeInTheDocument();
	const modal = dialog.element().parentElement;
	const overlay = modal?.parentElement;
	if (modal == null || overlay == null) throw new Error('Expected the mobile modal structure.');

	await waitForOverlayEnter(overlay);
	await expect.element(page.elementLocator(overlay)).toBeVisible();
	expect(window.innerWidth).toBe(390);
	expect(window.innerHeight).toBe(700);
	expect(window.matchMedia('(width > 450px)').matches).toBe(false);
	expect(getComputedStyle(modal).borderEndStartRadius).toBe('0px');
	expect(getComputedStyle(modal).borderEndEndRadius).toBe('0px');
}

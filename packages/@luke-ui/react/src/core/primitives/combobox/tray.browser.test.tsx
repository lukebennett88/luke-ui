import { Icon } from '@luke-ui/react/icon';
import {
	ComboboxClearButton,
	ComboboxInput,
	ComboboxInputGroup,
	ComboboxItem,
	ComboboxListBox,
	ComboboxRoot,
	ComboboxTray,
	ComboboxTrayTrigger,
} from '@luke-ui/react/primitives/combobox';
import type { ComboboxRootProps } from '@luke-ui/react/primitives/combobox';
import { Field } from '@luke-ui/react/primitives/field';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { render } from '../../test-utils/render.js';
import { waitForOverlayEnter } from '../../test-utils/wait-for-overlay-enter.js';

type CountryItem = {
	id: string;
	label: string;
};

const countryItems: Array<CountryItem> = [
	{ id: 'au', label: 'Australia' },
	{ id: 'ca', label: 'Canada' },
];

const renderCountryItem = (item: CountryItem) => <ComboboxItem>{item.label}</ComboboxItem>;

/** Minimal tray composition built from public primitives. */
function TrayCombobox(
	props: {
		'aria-label'?: string;
		defaultValue?: string;
		isDisabled?: boolean;
		isReadOnly?: boolean;
		label?: string;
		triggerLabel?: string;
	} & Pick<
		ComboboxRootProps<CountryItem>,
		'allowsCustomValue' | 'isRequired' | 'name' | 'validate' | 'validationBehavior'
	>,
) {
	const label = props.label ?? 'Country';

	return (
		<ComboboxRoot<CountryItem>
			allowsCustomValue={props.allowsCustomValue}
			aria-label={props['aria-label']}
			defaultItems={countryItems}
			defaultValue={props.defaultValue}
			isDisabled={props.isDisabled}
			isReadOnly={props.isReadOnly}
			isRequired={props.isRequired}
			name={props.name ?? 'country'}
			validate={props.validate}
			validationBehavior={props.validationBehavior}
		>
			<Field label={label}>
				<ComboboxInputGroup>
					<ComboboxTrayTrigger aria-label={props.triggerLabel} placeholder="Select a country...">
						<Icon name="chevronDown" />
					</ComboboxTrayTrigger>
				</ComboboxInputGroup>
				<ComboboxTray>
					<ComboboxInputGroup>
						<ComboboxInput placeholder="Select a country..." />
						<ComboboxClearButton aria-label="Clear search">
							<Icon name="close" />
						</ComboboxClearButton>
					</ComboboxInputGroup>
					<ComboboxListBox<CountryItem>>{renderCountryItem}</ComboboxListBox>
				</ComboboxTray>
			</Field>
		</ComboboxRoot>
	);
}

/** Opens the tray and waits for it to finish sliding up. */
async function openTray(triggerName = 'Country Select a country...', searchName = 'Country') {
	await userEvent.click(page.getByRole('button', { name: triggerName }));

	const dialog = page.getByRole('dialog');
	await expect.element(dialog).toBeVisible();

	const overlay = dialog.element().parentElement?.parentElement;
	if (overlay == null) throw new Error('Expected the tray overlay structure.');
	await waitForOverlayEnter(overlay);

	// React Aria moves focus to the search field asynchronously.
	await expect.element(page.getByRole('searchbox', { name: searchName })).toHaveFocus();
}

/**
 * Types into the focused tray search field. Prefer this over document-level keyboard entry so
 * keystrokes stay on the input after `openTray` has waited for focus.
 */
async function enterTraySearch(text: string, searchName = 'Country') {
	const searchbox = page.getByRole('searchbox', { name: searchName });
	await expect.element(searchbox).toHaveFocus();
	await userEvent.type(searchbox.element(), text, { skipClick: true });
	await expect.element(searchbox).toHaveValue(text);
}

test('ComboboxTray positions the overlay at the scroll offset each time it opens', async () => {
	// `top` must match `scrollY` on every open. Compiler caching is covered elsewhere.
	render(
		<>
			{/* Ancillary DOM: the page has to be scrollable for a scroll offset to exist. */}
			<div style={{ blockSize: '300vh' }} />
			<TrayCombobox />
		</>,
	);

	const readOverlayTop = async () => {
		const dialog = page.getByRole('dialog');
		await expect.element(dialog).toBeVisible();
		const overlay = dialog.element().parentElement?.parentElement;
		if (overlay == null) throw new Error('Expected the tray overlay structure.');
		await waitForOverlayEnter(overlay);
		return getComputedStyle(overlay).top;
	};

	window.scrollTo(0, 400);
	await expect.poll(() => window.scrollY).toBe(400);
	await openTray();
	expect(await readOverlayTop()).toBe(`${window.scrollY}px`);

	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

	window.scrollTo(0, 900);
	await expect.poll(() => window.scrollY).toBe(900);
	await openTray();
	expect(await readOverlayTop()).toBe(`${window.scrollY}px`);

	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	await expect
		.element(page.getByRole('button', { name: 'Country Select a country...' }))
		.toHaveFocus();

	window.scrollTo(0, 0);
});

test("ComboboxTray search field does not inherit the combobox trigger role's ARIA", async () => {
	render(<TrayCombobox />);
	await openTray();

	const searchbox = page.getByRole('searchbox', { name: 'Country' });
	const searchboxElement = searchbox.element();

	expect(searchboxElement).toHaveAttribute('role', 'searchbox');
	expect(searchboxElement).toHaveAttribute('aria-haspopup', 'listbox');
	// `aria-expanded` must not leak from `InputContext` onto the searchbox.
	expect(searchboxElement).not.toHaveAttribute('aria-expanded');
});

test('ComboboxTray search field does not toggle or close the tray on click or touch', async () => {
	render(<TrayCombobox />);
	await openTray();

	const searchbox = page.getByRole('searchbox', { name: 'Country' });
	const searchboxElement = searchbox.element();

	// A leaked `onTouchEnd` handler would close the tray.
	await userEvent.click(searchbox);
	searchboxElement.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true }));

	await expect.element(page.getByRole('dialog')).toBeVisible();
	await expect.element(searchbox).toHaveFocus();
});

test('ComboboxClearButton clears the search text inside a tray', async () => {
	render(<TrayCombobox />);
	await openTray();

	expect(page.getByRole('button', { name: 'Clear search' }).elements()).toHaveLength(0);

	await enterTraySearch('Aus');
	const searchbox = page.getByRole('searchbox', { name: 'Country' });
	await expect.element(searchbox).toHaveValue('Aus');

	await userEvent.click(page.getByRole('button', { name: 'Clear search' }));
	await expect.element(searchbox).toHaveValue('');
	await expect.element(page.getByRole('dialog')).toBeVisible();
});

test('ComboboxTrayTrigger names itself from the field label, selected value, or an explicit label', async () => {
	render(
		<>
			<TrayCombobox defaultValue="au" />
			<TrayCombobox defaultValue="au" label="Explicit" triggerLabel="Destination" />
		</>,
	);

	const trigger = page.getByRole('button', { name: 'Country Australia' });
	await expect.element(trigger).toBeVisible();
	expect(trigger.element()).toHaveAttribute('aria-expanded', 'false');
	expect(trigger.element()).toHaveAttribute('aria-haspopup', 'dialog');
	await expect.element(page.getByRole('button', { name: 'Destination' })).toBeVisible();
});

test('ComboboxTrayTrigger cannot open a read-only or disabled combobox', async () => {
	render(
		<>
			<TrayCombobox defaultValue="au" isReadOnly label="ReadOnly" />
			<TrayCombobox defaultValue="au" isDisabled label="Disabled" />
		</>,
	);

	const readOnlyTrigger = page.getByRole('button', { name: 'ReadOnly Australia' });
	const disabledTrigger = page.getByRole('button', { name: 'Disabled Australia' });

	await expect.element(readOnlyTrigger).toBeDisabled();
	await expect.element(readOnlyTrigger).toMatchTextContent('Australia');
	await expect.element(disabledTrigger).toBeDisabled();
	expect(page.getByRole('dialog').elements()).toHaveLength(0);
});

test('ComboboxTray search field does not reopen the popover while the tray is exiting', async () => {
	render(<TrayCombobox />);
	await openTray();

	const searchbox = page.getByRole('searchbox', { name: 'Country' });
	const dialog = page.getByRole('dialog');
	const overlay = dialog.element().parentElement?.parentElement;
	if (overlay == null) throw new Error('Expected the tray overlay structure.');

	// Children stay mounted and clickable during the exit transition.
	await userEvent.keyboard('{Escape}');
	await expect.poll(() => overlay.hasAttribute('data-exiting')).toBe(true);

	// Playwright will not click an element mid-transition, so dispatch the event directly.
	searchbox.element().dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
});

test('ComboboxTrayTrigger blocks submission of a required, unselected combobox while the tray is closed', async () => {
	let submitCount = 0;
	const { container } = render(
		<form
			aria-label="Country form"
			onSubmit={(event) => {
				event.preventDefault();
				submitCount += 1;
			}}
		>
			<TrayCombobox isRequired />
			<button type="submit">Submit</button>
		</form>,
	);
	const form = container.querySelector('form');
	if (form == null) throw new Error('Expected the form element.');

	await userEvent.click(page.getByRole('button', { name: 'Submit' }).element());
	expect(submitCount).toBe(0);

	expect(new FormData(form).getAll('country')).toHaveLength(1);

	await userEvent.click(
		page.getByRole('button', { name: 'Country* Select a country...' }).element(),
	);
	await userEvent.click(page.getByRole('option', { name: 'Australia' }).element());
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

	await userEvent.click(page.getByRole('button', { name: 'Submit' }).element());
	expect(submitCount).toBe(1);
	expect(new FormData(form).get('country')).toBe('au');
});

test('ComboboxTrayTrigger blocks a closed tray on a custom validation error', async () => {
	let submitCount = 0;
	render(
		<form
			aria-label="Country form"
			onSubmit={(event) => {
				event.preventDefault();
				submitCount += 1;
			}}
		>
			<TrayCombobox
				defaultValue="au"
				validate={({ value }) => (value === 'au' ? 'Pick somewhere else.' : null)}
			/>
			<button type="submit">Submit</button>
		</form>,
	);

	await userEvent.click(page.getByRole('button', { name: 'Submit' }).element());
	expect(submitCount).toBe(0);
	await expect.element(page.getByText('Pick somewhere else.')).toBeVisible();

	await userEvent.click(page.getByRole('button', { name: 'Country Australia' }).element());
	await userEvent.click(page.getByRole('option', { name: 'Canada' }).element());
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

	await userEvent.click(page.getByRole('button', { name: 'Submit' }).element());
	expect(submitCount).toBe(1);
});

test('ComboboxTrayTrigger exempts disabled, read-only, and aria-validated combobox from blocking submission', async () => {
	const submitted: Array<string> = [];
	const renderCase = (label: string, props: Partial<Parameters<typeof TrayCombobox>[0]>) => (
		<form
			aria-label={`${label} form`}
			onSubmit={(event) => {
				event.preventDefault();
				submitted.push(label);
			}}
		>
			<TrayCombobox isRequired label={label} triggerLabel={label} {...props} />
			<button type="submit">Submit {label}</button>
		</form>
	);

	render(
		<>
			{renderCase('Disabled', { isDisabled: true })}
			{renderCase('ReadOnly', { isReadOnly: true })}
			{renderCase('Aria', { validationBehavior: 'aria' })}
		</>,
	);

	// oxlint-disable-next-line no-await-in-loop
	for (const label of ['Disabled', 'ReadOnly', 'Aria']) {
		// oxlint-disable-next-line no-await-in-loop
		await userEvent.click(page.getByRole('button', { name: `Submit ${label}` }).element());
	}

	expect(submitted).toEqual(['Disabled', 'ReadOnly', 'Aria']);
});

test('ComboboxTrayTrigger submits custom text in text mode while the tray is closed', async () => {
	const { container } = render(
		<form aria-label="Country form">
			<TrayCombobox allowsCustomValue />
		</form>,
	);
	const form = container.querySelector('form');
	if (form == null) throw new Error('Expected the form element.');

	await openTray();
	// The search field must not keep `name`, or it double-submits with the trigger.
	expect(page.getByRole('searchbox', { name: 'Country' }).element()).not.toHaveAttribute('name');

	await enterTraySearch('Freedonia');
	expect(new FormData(form).getAll('country')).toEqual(['Freedonia']);

	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	expect(new FormData(form).getAll('country')).toEqual(['Freedonia']);

	await openTray();
	await userEvent.clear(page.getByRole('searchbox', { name: 'Country' }).element());
	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	expect(new FormData(form).getAll('country')).toEqual(['']);
});

test('ComboboxTrayTrigger does not submit text-mode values when disabled', async () => {
	const { container } = render(
		<form aria-label="Disabled form">
			<TrayCombobox allowsCustomValue defaultValue="au" isDisabled label="Disabled" />
		</form>,
	);
	const form = container.querySelector('form');
	if (form == null) throw new Error('Expected the form element.');

	expect(new FormData(form).getAll('country')).toEqual([]);
});

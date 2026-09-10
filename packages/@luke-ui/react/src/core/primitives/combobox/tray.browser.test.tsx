import { Form } from 'react-aria-components/Form';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { Icon } from '../../icon/icon.js';
import { render } from '../../test-utils/render.js';
import { waitForOverlayEnter } from '../../test-utils/wait-for-overlay-enter.js';
import { Field } from '../field/field.js';
import { ComboboxClearButton } from './clear-button.js';
import { ComboboxInputGroup } from './input-group.js';
import { ComboboxInput } from './input.js';
import { ComboboxItem } from './item.js';
import { ComboboxListBox } from './listbox.js';
import type { ComboboxRootProps } from './root.js';
import { ComboboxRoot } from './root.js';
import { ComboboxTrayTrigger } from './tray-trigger.js';
import { ComboboxTray } from './tray.js';

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
		| 'allowsCustomValue'
		| 'form'
		| 'formValue'
		| 'isRequired'
		| 'name'
		| 'validate'
		| 'validationBehavior'
	>,
) {
	const label = props.label ?? 'Country';

	return (
		<ComboboxRoot<CountryItem>
			allowsCustomValue={props.allowsCustomValue}
			aria-label={props['aria-label']}
			defaultItems={countryItems}
			defaultValue={props.defaultValue}
			form={props.form}
			formValue={props.formValue}
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
async function openTray() {
	await userEvent.click(page.getByRole('button', { name: 'Country' }));

	const dialog = page.getByRole('dialog');
	await expect.element(dialog).toBeVisible();

	const overlay = dialog.element().parentElement?.parentElement;
	if (overlay == null) throw new Error('Expected the tray overlay structure.');
	await waitForOverlayEnter(overlay);

	// React Aria moves focus to the search field asynchronously.
	await expect.element(page.getByRole('searchbox', { name: 'Country' })).toHaveFocus();
}

/**
 * Types into the focused tray search field. Prefer this over document-level keyboard entry so
 * keystrokes stay on the input after `openTray` has waited for focus.
 */
async function enterTraySearch(text: string) {
	const searchbox = page.getByRole('searchbox', { name: 'Country' });
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
	await expect.element(page.getByRole('button', { name: 'Country' })).toHaveFocus();

	window.scrollTo(0, 0);
});

test('ComboboxTray opens from the trigger, focuses the search field, and dismisses', async () => {
	render(<TrayCombobox />);

	expect(page.getByRole('searchbox').elements()).toHaveLength(0);

	await openTray();

	const searchbox = page.getByRole('searchbox', { name: 'Country' });
	await expect.element(searchbox).toHaveFocus();
	expect(searchbox.element()).toHaveAttribute('aria-haspopup', 'listbox');

	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
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

test('ComboboxTray keeps focus on the search field while arrow keys move the active option', async () => {
	render(<TrayCombobox />);
	await openTray();

	const searchbox = page.getByRole('searchbox', { name: 'Country' });
	await userEvent.keyboard('{ArrowDown}');

	await expect.element(searchbox).toHaveFocus();
	await expect.poll(() => searchbox.element().getAttribute('aria-activedescendant')).not.toBeNull();
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

test('ComboboxTrayTrigger names itself from the field label and its selected value', async () => {
	render(<TrayCombobox defaultValue="au" />);

	const trigger = page.getByRole('button', { name: 'Country Australia' });
	await expect.element(trigger).toBeVisible();
	expect(trigger.element()).toHaveAttribute('aria-expanded', 'false');
	expect(trigger.element()).toHaveAttribute('aria-haspopup', 'dialog');
});

test('ComboboxTrayTrigger cannot open a read-only combobox', async () => {
	render(<TrayCombobox defaultValue="au" isReadOnly />);

	const trigger = page.getByRole('button', { name: 'Country Australia' });
	await expect.element(trigger).toBeDisabled();

	await expect.element(trigger).toHaveTextContent('Australia');
	expect(page.getByRole('dialog').elements()).toHaveLength(0);
});

test('ComboboxTrayTrigger cannot open a disabled combobox', async () => {
	render(<TrayCombobox defaultValue="au" isDisabled />);

	const trigger = page.getByRole('button', { name: 'Country Australia' });
	await expect.element(trigger).toBeDisabled();
	expect(page.getByRole('dialog').elements()).toHaveLength(0);
});

test('ComboboxTrayTrigger uses an explicit accessible name', async () => {
	render(<TrayCombobox defaultValue="au" triggerLabel="Destination" />);

	await expect.element(page.getByRole('button', { name: 'Destination' })).toBeVisible();
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

test('ComboboxTray collection-building pass does not leak duplicate structure', async () => {
	render(<TrayCombobox />);

	expect(page.getByRole('searchbox').elements()).toHaveLength(0);
	expect(page.getByRole('button', { name: 'Clear search' }).elements()).toHaveLength(0);

	await openTray();

	expect(page.getByRole('option').elements()).toHaveLength(countryItems.length);
});

test('ComboboxTray stays closed after an option is selected', async () => {
	render(<TrayCombobox />);
	await openTray();

	await userEvent.click(page.getByRole('option', { name: 'Australia' }));

	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	await expect.element(page.getByRole('button', { name: 'Country Australia' })).toBeVisible();
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

	await userEvent.click(page.getByRole('button', { name: 'Country' }).element());
	await userEvent.click(page.getByRole('option', { name: 'Australia' }).element());
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

	await userEvent.click(page.getByRole('button', { name: 'Submit' }).element());
	expect(submitCount).toBe(1);
	expect(new FormData(form).get('country')).toBe('au');
});

test('ComboboxTrayTrigger allows a required combobox with allowsCustomValue to submit typed text', async () => {
	let submitCount = 0;
	render(
		<form
			aria-label="Country form"
			onSubmit={(event) => {
				event.preventDefault();
				submitCount += 1;
			}}
		>
			<TrayCombobox allowsCustomValue isRequired />
			<button type="submit">Submit</button>
		</form>,
	);

	await openTray();
	await enterTraySearch('Freedonia');
	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

	await userEvent.click(page.getByRole('button', { name: 'Submit' }).element());
	expect(submitCount).toBe(1);

	await openTray();
	await userEvent.clear(page.getByRole('searchbox', { name: 'Country' }).element());
	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

	await userEvent.click(page.getByRole('button', { name: 'Submit' }).element());
	expect(submitCount).toBe(1);
});

test('ComboboxTrayTrigger sends focus to the first invalid combobox when several are invalid', async () => {
	render(
		<form aria-label="Trip form">
			<TrayCombobox isRequired label="Origin" name="origin" triggerLabel="Origin" />
			<TrayCombobox isRequired label="Destination" name="destination" triggerLabel="Destination" />
			<button type="submit">Submit</button>
		</form>,
	);

	await userEvent.click(page.getByRole('button', { name: 'Submit' }).element());

	await expect.element(page.getByRole('button', { name: 'Origin' })).toHaveFocus();
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

	await userEvent.click(page.getByRole('button', { name: /Country/ }).element());
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

test('ComboboxTrayTrigger inherits validationBehavior from an enclosing Form', async () => {
	const { container } = render(
		<Form aria-label="Country form" validationBehavior="aria">
			<TrayCombobox isRequired />
		</Form>,
	);
	const form = container.querySelector('form');
	if (form == null) throw new Error('Expected the form element.');

	// Under `aria` validation, and with Form `noValidate`, no constraint inputs participate.
	const controls = [...form.querySelectorAll('input')];
	expect(controls.length).toBeGreaterThan(0);
	expect(controls.map((control) => control.willValidate)).not.toContain(true);
});

test('ComboboxTrayTrigger associates with an external form via the root form prop', async () => {
	let submitCount = 0;
	const { container } = render(
		<>
			<form
				aria-label="Country form"
				id="country-form"
				onSubmit={(event) => {
					event.preventDefault();
					submitCount += 1;
				}}
			/>
			<TrayCombobox form="country-form" isRequired />
		</>,
	);
	const form = container.querySelector('form');
	if (form == null) throw new Error('Expected the form element.');

	form.requestSubmit();
	expect(submitCount).toBe(0);

	await userEvent.click(page.getByRole('button', { name: 'Country' }).element());
	await userEvent.click(page.getByRole('option', { name: 'Australia' }).element());
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

	form.requestSubmit();
	expect(submitCount).toBe(1);
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

test('ComboboxTrayTrigger submits the option text, not its key, in text mode', async () => {
	const { container } = render(
		<form aria-label="Country form">
			<TrayCombobox allowsCustomValue />
		</form>,
	);
	const form = container.querySelector('form');
	if (form == null) throw new Error('Expected the form element.');

	await openTray();
	await userEvent.click(page.getByRole('option', { name: 'Australia' }).element());
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

	expect(new FormData(form).getAll('country')).toEqual(['Australia']);
});

test('ComboboxTrayTrigger submits one text-mode value through an external form association', async () => {
	const { container } = render(
		<>
			<form aria-label="Country form" id="country-form" />
			<TrayCombobox allowsCustomValue form="country-form" />
		</>,
	);
	const form = container.querySelector('form');
	if (form == null) throw new Error('Expected the form element.');

	// The search field must not keep `name`, or it double-submits with the trigger.
	await openTray();
	const searchbox = page.getByRole('searchbox', { name: 'Country' });
	expect(searchbox.element()).not.toHaveAttribute('name');

	await enterTraySearch('Freedonia');
	expect(new FormData(form).getAll('country')).toEqual(['Freedonia']);

	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	expect(new FormData(form).getAll('country')).toEqual(['Freedonia']);
});

test('ComboboxTrayTrigger submits text-mode values for read-only and aria-validated combobox but not a disabled one', async () => {
	const { container } = render(
		<>
			<form aria-label="ReadOnly form">
				<TrayCombobox allowsCustomValue defaultValue="au" isReadOnly label="ReadOnly" />
			</form>
			<form aria-label="Aria form">
				<TrayCombobox allowsCustomValue defaultValue="au" label="Aria" validationBehavior="aria" />
			</form>
			<form aria-label="Disabled form">
				<TrayCombobox allowsCustomValue defaultValue="au" isDisabled label="Disabled" />
			</form>
		</>,
	);
	const forms = [...container.querySelectorAll('form')];
	const [readOnlyForm, ariaForm, disabledForm] = forms;
	if (readOnlyForm == null || ariaForm == null || disabledForm == null) {
		throw new Error('Expected three form elements.');
	}

	expect(new FormData(readOnlyForm).getAll('country')).toEqual(['Australia']);
	expect(new FormData(ariaForm).getAll('country')).toEqual(['Australia']);
	expect(new FormData(disabledForm).getAll('country')).toEqual([]);
});

test('ComboboxTrayTrigger leaves key-mode submission to React Aria', async () => {
	const { container } = render(
		<form aria-label="Country form">
			<TrayCombobox defaultValue="au" />
		</form>,
	);
	const form = container.querySelector('form');
	if (form == null) throw new Error('Expected the form element.');

	expect(new FormData(form).getAll('country')).toEqual(['au']);

	await openTray();
	expect(new FormData(form).getAll('country')).toEqual(['au']);

	await userEvent.click(page.getByRole('option', { name: 'Canada' }).element());
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	expect(new FormData(form).getAll('country')).toEqual(['ca']);

	// A disabled key-mode field still submits through React Aria's hidden input. The docs rely on that.
	const { container: disabledContainer } = render(
		<form aria-label="Disabled country form">
			<TrayCombobox defaultValue="au" isDisabled />
		</form>,
	);
	const disabledForm = disabledContainer.querySelector('form');
	if (disabledForm == null) throw new Error('Expected the form element.');
	expect(new FormData(disabledForm).getAll('country')).toEqual(['au']);
});

test('ComboboxTrayTrigger submits text for an explicit formValue of text', async () => {
	const { container } = render(
		<form aria-label="Country form">
			<TrayCombobox defaultValue="au" formValue="text" />
		</form>,
	);
	const form = container.querySelector('form');
	if (form == null) throw new Error('Expected the form element.');

	expect(new FormData(form).getAll('country')).toEqual(['Australia']);
});

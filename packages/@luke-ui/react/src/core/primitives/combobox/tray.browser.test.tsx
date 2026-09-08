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

/**
 * The standard tray composition, written the way a consumer would write it: only exported
 * primitives, no React Aria context and no styling of its own.
 */
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
						<Icon aria-hidden name="chevronDown" />
					</ComboboxTrayTrigger>
				</ComboboxInputGroup>
				<ComboboxTray>
					<ComboboxInputGroup>
						<ComboboxInput placeholder="Select a country..." />
						<ComboboxClearButton aria-label="Clear search">
							<Icon aria-hidden name="close" />
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

	// React Aria moves focus to the search field asynchronously once the tray is open. Typing
	// before that lands drops the leading keystrokes on a slow runner, so callers that type
	// immediately after opening need focus to have settled first.
	await expect.element(page.getByRole('searchbox', { name: 'Country' })).toHaveFocus();
}

test('ComboboxTray positions the overlay at the scroll offset each time it opens', async () => {
	// `mobileOverlay` is absolutely positioned, so it has to be offset by the document scroll
	// position to line up with the top of the viewport. Vitest does not run the React Compiler, so
	// this guards the runtime semantics rather than reproducing the compiled caching bug; the
	// compiled output is covered by `overlays/mobile-overlay.test.ts`.
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

	// Reopening at a different offset has to use the new position, not the one captured on the
	// first open.
	window.scrollTo(0, 900);
	await expect.poll(() => window.scrollY).toBe(900);
	await openTray();
	expect(await readOverlayTop()).toBe(`${window.scrollY}px`);

	// Dismissing returns focus to the trigger, which is what a consumer scrolls back to.
	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	await expect.element(page.getByRole('button', { name: 'Country' })).toHaveFocus();

	window.scrollTo(0, 0);
});

test('ComboboxTray opens from the trigger, focuses the search field, and dismisses', async () => {
	render(<TrayCombobox />);

	// Nothing inside the tray is mounted while it is closed.
	expect(page.getByRole('searchbox').elements()).toHaveLength(0);

	await openTray();

	const searchbox = page.getByRole('searchbox', { name: 'Country' });
	await expect.element(searchbox).toHaveFocus();
	// The search field filters the tray's listbox rather than re-announcing the combobox.
	expect(searchbox.element()).toHaveAttribute('aria-haspopup', 'listbox');

	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
});

test("ComboboxTray search field does not inherit the combobox trigger role's ARIA", async () => {
	render(<TrayCombobox />);
	await openTray();

	const searchbox = page.getByRole('searchbox', { name: 'Country' });
	const searchboxElement = searchbox.element();

	// It is a searchbox, not a combobox trigger.
	expect(searchboxElement).toHaveAttribute('role', 'searchbox');
	expect(searchboxElement).toHaveAttribute('aria-haspopup', 'listbox');
	// `aria-expanded` belongs to the combobox trigger button, not a searchbox: React Aria's
	// `InputContext` inside a tray carries the full `useComboBox` `inputProps`, and this asserts
	// it has been filtered out rather than merged onto the rendered element.
	expect(searchboxElement).not.toHaveAttribute('aria-expanded');
});

test('ComboboxTray search field does not toggle or close the tray on click or touch', async () => {
	render(<TrayCombobox />);
	await openTray();

	const searchbox = page.getByRole('searchbox', { name: 'Country' });
	const searchboxElement = searchbox.element();

	// React Aria's combobox `inputProps` include a touch handler that toggles the popover; if it
	// leaked through, clicking/touching the search field while the tray is open would close it.
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

	// Virtual focus: DOM focus stays put and the active option is published instead.
	await expect.element(searchbox).toHaveFocus();
	await expect.poll(() => searchbox.element().getAttribute('aria-activedescendant')).not.toBeNull();
});

test('ComboboxClearButton clears the search text inside a tray', async () => {
	render(<TrayCombobox />);
	await openTray();

	// Nothing to clear until something has been typed.
	expect(page.getByRole('button', { name: 'Clear search' }).elements()).toHaveLength(0);

	await userEvent.keyboard('Aus');
	const searchbox = page.getByRole('searchbox', { name: 'Country' });
	await expect.element(searchbox).toHaveValue('Aus');

	await userEvent.click(page.getByRole('button', { name: 'Clear search' }));
	await expect.element(searchbox).toHaveValue('');
	// Clearing the search must not close the tray.
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

	// A read-only combobox still shows what is selected, it just cannot be reopened.
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

	// `MobileOverlay` keeps its children mounted through the CSS exit transition, so the
	// search field is still in the DOM (and clickable) for a window after `Escape` closes
	// the combobox. `state.isOpen` is already false in that window.
	await userEvent.keyboard('{Escape}');
	await expect.poll(() => overlay.hasAttribute('data-exiting')).toBe(true);

	// Clicking the search field while it is exiting must not run the popover's open path.
	// `userEvent.click` waits for Playwright's actionability check, which refuses to click an
	// element mid-transition; dispatching the click event directly reproduces what a real
	// pointer click delivers to the input without that wait.
	searchbox.element().dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
});

test('ComboboxTray collection-building pass does not leak duplicate structure', async () => {
	render(<TrayCombobox />);

	// While closed, the only render of the tray subtree is React Aria's hidden collection-building
	// pass. Hideable tray-only controls must not surface in the accessible tree from that pass.
	expect(page.getByRole('searchbox').elements()).toHaveLength(0);
	expect(page.getByRole('button', { name: 'Clear search' }).elements()).toHaveLength(0);

	await openTray();

	// If the hidden pass had duplicated collection items, the listbox would report more than the
	// two fixture options once the tray is actually open.
	expect(page.getByRole('option').elements()).toHaveLength(countryItems.length);
});

test('ComboboxTray stays closed after an option is selected', async () => {
	render(<TrayCombobox />);
	await openTray();

	// React Stately closes the menu itself whenever a single-select value changes, so selecting an
	// option dismisses the tray with no help from Luke UI.
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

	// This is a public composition of only exported primitives — no `ComboboxField` involved — so
	// the required participant while the tray is closed has to come from `ComboboxTrayTrigger` alone.
	await userEvent.click(page.getByRole('button', { name: 'Submit' }).element());
	expect(submitCount).toBe(0);

	// The validation input has no `name`, so it never adds a second submitted value alongside React
	// Aria's own hidden input.
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

	// Typed text with no matching option is still a valid value once `allowsCustomValue` is set, so
	// `required` must be satisfied by the input text rather than only a selected key.
	await openTray();
	const searchbox = page.getByRole('searchbox', { name: 'Country' });
	await userEvent.keyboard('Freedonia');
	// React Stately keeps the typed input value on close rather than reverting it, since
	// `allowsCustomValue` means there is nothing to revert to.
	await expect.element(searchbox).toHaveValue('Freedonia');
	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

	await userEvent.click(page.getByRole('button', { name: 'Submit' }).element());
	expect(submitCount).toBe(1);

	// Emptying the custom text afterwards must still block submission.
	await openTray();
	await userEvent.clear(page.getByRole('searchbox', { name: 'Country' }));
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

	// The browser fires `invalid` on each required control in document order; each handler must
	// yield to whichever one is first rather than every handler focusing its own trigger.
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

	// The `validate` result reaches the closed tray, not just the unmounted search input, and the
	// message surfaces through `FieldError` rather than only blocking silently.
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

	// A control exempt from constraint validation must never block a submit on an empty value.
	render(
		<>
			{renderCase('Disabled', { isDisabled: true })}
			{renderCase('ReadOnly', { isReadOnly: true })}
			{renderCase('Aria', { validationBehavior: 'aria' })}
		</>,
	);

	// Sequential on purpose: each submit has to settle before the next one is attempted.
	// oxlint-disable-next-line no-await-in-loop
	for (const label of ['Disabled', 'ReadOnly', 'Aria']) {
		// oxlint-disable-next-line no-await-in-loop
		await userEvent.click(page.getByRole('button', { name: `Submit ${label}` }).element());
	}

	expect(submitted).toEqual(['Disabled', 'ReadOnly', 'Aria']);
});

test('ComboboxTrayTrigger inherits validationBehavior from an enclosing Form', async () => {
	const { container } = render(
		// `validationBehavior` is set on the form, not repeated on the root.
		<Form aria-label="Country form" validationBehavior="aria">
			<TrayCombobox isRequired />
		</Form>,
	);
	const form = container.querySelector('form');
	if (form == null) throw new Error('Expected the form element.');

	// Under `aria`, the validation input must not be a participating constraint at all. `<Form>`
	// also sets `noValidate`, so submission alone cannot tell the two behaviours apart.
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

	// The hidden validation input carries `form="country-form"`, so it participates in — and can
	// block — a `<form>` submission even though it renders outside that form element in the DOM.
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

	// In text mode React Aria names the visible text input and renders no hidden input of its own.
	// A tray only has that input while it is open, so the closed tray needs a submitted value from
	// somewhere else.
	await openTray();
	await userEvent.keyboard('Freedonia');
	await expect.element(page.getByRole('searchbox', { name: 'Country' })).toHaveValue('Freedonia');
	expect(new FormData(form).getAll('country')).toEqual(['Freedonia']);

	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	expect(new FormData(form).getAll('country')).toEqual(['Freedonia']);

	// Clearing the text submits an empty value rather than the last non-empty one.
	await openTray();
	await userEvent.clear(page.getByRole('searchbox', { name: 'Country' }));
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

	// With an explicit `form`, React Aria's search input participates in the external form from
	// inside the tray portal, so it must relinquish the submission `name` React Aria gives it in
	// text mode rather than double up with the value the trigger submits.
	await openTray();
	const searchbox = page.getByRole('searchbox', { name: 'Country' });
	expect(searchbox.element()).not.toHaveAttribute('name');

	await userEvent.keyboard('Freedonia');
	await expect.element(searchbox).toHaveValue('Freedonia');
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

	// The validation input is `disabled` in these states so it never gates submission; a separate,
	// enabled submission input is what keeps the value itself submitting.
	expect(new FormData(readOnlyForm).getAll('country')).toEqual(['Australia']);
	expect(new FormData(ariaForm).getAll('country')).toEqual(['Australia']);
	// A disabled field is excluded from the form entry list entirely.
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

	// The default `formValue` submits the selected key through React Aria's own hidden input, so the
	// tray must not add a second entry.
	expect(new FormData(form).getAll('country')).toEqual(['au']);

	await openTray();
	expect(new FormData(form).getAll('country')).toEqual(['au']);

	await userEvent.click(page.getByRole('option', { name: 'Canada' }).element());
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	expect(new FormData(form).getAll('country')).toEqual(['ca']);

	// This pins React Aria's hidden-input behaviour because the public docs now rely on it: a
	// disabled key-mode combobox has no `disabled` attribute on that hidden input, so it keeps
	// submitting the selected key. A RAC upgrade that changes this must fail here loudly rather
	// than silently contradicting the page.
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

	// `formValue="text"` puts the field in text mode without `allowsCustomValue`.
	expect(new FormData(form).getAll('country')).toEqual(['Australia']);
});

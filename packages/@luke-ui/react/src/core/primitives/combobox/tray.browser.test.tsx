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
function TrayCombobox(props: {
	'aria-label'?: string;
	defaultValue?: string;
	isDisabled?: boolean;
	isReadOnly?: boolean;
	triggerLabel?: string;
}) {
	return (
		<ComboboxRoot<CountryItem>
			aria-label={props['aria-label']}
			defaultItems={countryItems}
			defaultValue={props.defaultValue}
			isDisabled={props.isDisabled}
			isReadOnly={props.isReadOnly}
			name="country"
		>
			<Field label="Country">
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
}

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

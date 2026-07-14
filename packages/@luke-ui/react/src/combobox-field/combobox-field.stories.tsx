import { Button } from '@luke-ui/react/button';
import { ComboboxField } from '@luke-ui/react/combobox-field';
import { ComboboxItem, ComboboxSection } from '@luke-ui/react/combobox-field/primitive';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import type { Key } from 'react-aria-components/Breadcrumbs';
import { Form } from 'react-aria-components/Form';
import { useAsyncList } from 'react-aria-components/useAsyncList';
import { expect, userEvent, within } from 'storybook/test';
import preview from '../../.storybook/preview.js';

const meta = preview.meta({
	component: ComboboxField,
	tags: ['forms'],
	title: 'Forms/ComboboxField',
});

type CountryItem = {
	id: string;
	label: string;
};

const countryItems: Array<CountryItem> = [
	{ id: 'au', label: 'Australia' },
	{ id: 'ca', label: 'Canada' },
	{ id: 'nz', label: 'New Zealand' },
	{ id: 'us', label: 'United States' },
	{ id: 'se', label: 'Sweden' },
];

const stackStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: '1rem',
	maxInlineSize: '24rem',
} as const satisfies CSSProperties;

/**
 * Use the ComboboxField component when the user needs to choose one option from a large group of options.
 */
export const Default = meta.story({
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const page = within(document.body);
		const combobox = canvas.getByRole('combobox', { name: 'Country' });
		const control = canvas.getByRole('group');

		await step('the keyboard opens the options and moves active focus', async () => {
			await userEvent.tab();
			await expect(combobox).toHaveFocus();
			await userEvent.keyboard('{ArrowDown}');
			await expect(combobox).toHaveAttribute('aria-expanded', 'true');
			await expect(page.getByRole('option', { name: 'Australia' })).toHaveAttribute(
				'data-focused',
				'true',
			);
		});

		await step('the popover aligns with the control well', async () => {
			const controlRect = control.getBoundingClientRect();
			const listboxRect = page.getByRole('listbox').getBoundingClientRect();
			const listboxGap = listboxRect.top - controlRect.bottom;
			await expect(listboxGap).toBeGreaterThanOrEqual(4);
			await expect(listboxGap).toBeLessThanOrEqual(6);
			const inlineStartInset = listboxRect.left - controlRect.left;
			await expect(inlineStartInset).toBeGreaterThanOrEqual(1);
			await expect(inlineStartInset).toBeLessThanOrEqual(13);
			await expect(Math.abs(listboxRect.width + 2 - controlRect.width)).toBeLessThanOrEqual(1);
		});

		await step('selecting an option closes the popover and fills the input', async () => {
			await userEvent.click(page.getByRole('option', { name: 'Australia' }));
			await expect(combobox).toHaveValue('Australia');
			await expect(combobox).toHaveAttribute('aria-expanded', 'false');
		});
	},
	render: function Render() {
		return (
			<div style={stackStyle}>
				<ComboboxField
					defaultItems={countryItems}
					description="Select where the user is located."
					label="Country"
					name="country"
					placeholder="Select a country..."
				>
					{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
				</ComboboxField>
			</div>
		);
	},
});

/**
 * Uncontrolled mode uses `defaultValue` and `defaultItems`.
 * The component manages its own state internally.
 */
export const Uncontrolled = meta.story({
	render: function Render() {
		return (
			<ComboboxField
				defaultItems={countryItems}
				defaultValue="ca"
				label="Uncontrolled Combobox"
				name="uncontrolled"
				placeholder="Select a country..."
			>
				{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
			</ComboboxField>
		);
	},
});

/**
 * The selected option shows a checkmark in the listbox, and the control shows
 * a clear button while a selection is present.
 */
export const ClearSelection = meta.story({
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const page = within(document.body);
		const combobox = canvas.getByRole('combobox', { name: 'Country' });

		// A selection is present, so the clear button renders.
		const clearButton = canvas.getByRole('button', { name: 'Clear selection' });
		await expect(combobox).toHaveValue('Canada');

		// The selected option is marked with a checkmark.
		await userEvent.click(combobox);
		const selected = page.getByRole('option', { name: 'Canada' });
		await expect(selected).toHaveAttribute('aria-selected', 'true');
		await expect(selected.querySelector('svg')).not.toBeNull();

		// Clearing resets the value and removes the clear button.
		await userEvent.click(clearButton);
		await expect(combobox).toHaveValue('');
		await expect(canvas.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();
	},
	render: function Render() {
		return (
			<ComboboxField
				defaultItems={countryItems}
				defaultValue="ca"
				label="Country"
				name="country"
				placeholder="Select a country..."
			>
				{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
			</ComboboxField>
		);
	},
});

/**
 * Controlled mode uses `value`, `onChange`, and `items`.
 * The parent component manages the state.
 */
export const Controlled = meta.story({
	render: function Render() {
		const [value, setValue] = useState<Key | null>('us');
		const [inputValue, setInputValue] = useState('');

		return (
			<div style={stackStyle}>
				<ComboboxField
					inputValue={inputValue}
					items={countryItems}
					label="Controlled Combobox"
					name="controlled"
					onChange={setValue}
					onInputChange={setInputValue}
					placeholder="Select a country..."
					value={value}
				>
					{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
				</ComboboxField>
				<p>Selected: {value ?? 'None'}</p>
			</div>
		);
	},
});

const sizeStoryItems: Array<CountryItem> = [...countryItems, { id: 'override', label: 'Override' }];

/**
 * The input supports two sizes: small and medium (default).
 * Prefer using size consistently with other form controls.
 */
export const Size = meta.story({
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const page = within(document.body);

		const smallInput = canvas.getByRole('combobox', { name: 'Small' });
		const mediumInput = canvas.getByRole('combobox', { name: 'Medium (default)' });
		const smallControl = smallInput.closest('[role="group"]')!;
		const mediumControl = mediumInput.closest('[role="group"]')!;

		// Verify controls have different computed block sizes
		await expect(window.getComputedStyle(smallControl).blockSize).not.toBe(
			window.getComputedStyle(mediumControl).blockSize,
		);

		// Open small combobox and check first option padding
		await userEvent.click(smallInput);
		const smallOptions = page.getAllByRole('option');
		await expect(smallOptions.length).toBeGreaterThan(0);
		const smallFirstOption = smallOptions[0]!;
		const smallOptionPadding = window.getComputedStyle(smallFirstOption).paddingBlock;

		// Close small and open medium
		await userEvent.keyboard('{Escape}');
		await userEvent.click(mediumInput);
		const mediumOptions = page.getAllByRole('option');
		await expect(mediumOptions.length).toBeGreaterThan(0);
		const mediumFirstOption = mediumOptions[0]!;
		const mediumOptionPadding = window.getComputedStyle(mediumFirstOption).paddingBlock;

		await expect(smallOptionPadding).not.toBe(mediumOptionPadding);

		// Close medium and open small again to check override
		await userEvent.keyboard('{Escape}');
		await userEvent.click(smallInput);
		const overrideOption = page.getByRole('option', { name: 'Override' });
		const overridePadding = window.getComputedStyle(overrideOption).paddingBlock;
		await expect(overridePadding).toBe(mediumOptionPadding);
	},
	render: function Render() {
		return (
			<div style={stackStyle}>
				<ComboboxField
					defaultItems={sizeStoryItems}
					label="Small"
					name="small"
					placeholder="Small"
					size="small"
				>
					{(item) => (
						<ComboboxItem size={item.id === 'override' ? 'medium' : undefined}>
							{item.label}
						</ComboboxItem>
					)}
				</ComboboxField>
				<ComboboxField
					defaultItems={sizeStoryItems}
					label="Medium (default)"
					name="medium"
					placeholder="Medium"
				>
					{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
				</ComboboxField>
			</div>
		);
	},
});

/**
 * Disabling the combobox input can be done via the disabled prop.
 */
export const Disabled = meta.story({
	render: function Render() {
		return (
			<ComboboxField
				defaultItems={countryItems}
				description="Temporarily unavailable"
				isDisabled
				label="Country"
				name="disabled"
				placeholder="Select a country..."
			>
				{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
			</ComboboxField>
		);
	},
});

/**
 * Read-only comboboxes preserve their selected value without exposing interactive actions.
 */
export const ReadOnly = meta.story({
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const combobox = canvas.getByRole('combobox', { name: 'Country' });

		await expect(combobox).toHaveValue('Canada');
		await expect(combobox).toHaveAttribute('readonly');
		await expect(canvas.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();
	},
	render: function Render() {
		return (
			<ComboboxField
				defaultItems={countryItems}
				defaultValue="ca"
				description="The saved country cannot be changed."
				isReadOnly
				label="Country"
				name="readonly"
			>
				{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
			</ComboboxField>
		);
	},
});

/**
 * Groups are used to separate items into appropriate sections.
 * A divider is also included between each section.
 */
export const Groups = meta.story({
	render: function Render() {
		return (
			<ComboboxField label="Country" name="grouped" placeholder="Select a country...">
				<ComboboxSection id="north" title="Northern hemisphere">
					<ComboboxItem id="ca">Canada</ComboboxItem>
					<ComboboxItem id="us">United States</ComboboxItem>
					<ComboboxItem id="se">Sweden</ComboboxItem>
				</ComboboxSection>
				<ComboboxSection id="south" title="Southern hemisphere">
					<ComboboxItem id="au">Australia</ComboboxItem>
					<ComboboxItem id="nz">New Zealand</ComboboxItem>
				</ComboboxSection>
			</ComboboxField>
		);
	},
});

interface Pokemon {
	name: string;
}

/**
 * Async filtering forwards the listbox loading UI through listBoxProps.
 */
export const AsyncFiltering = meta.story({
	render: function AsyncFilteringExample() {
		const [value, setValue] = useState<Key | null>(null);

		const list = useAsyncList<Pokemon>({
			async load({ signal }) {
				const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=100', { signal });
				const json = await res.json();

				return {
					items: json.results,
				};
			},
		});

		return (
			<div style={stackStyle}>
				<ComboboxField
					items={list.items}
					label="Pick a Pokemon"
					loadingState={list.loadingState}
					name="pokemon"
					onChange={setValue}
					onInputChange={(text) => list.setFilterText(text)}
					placeholder="Search for a Pokemon..."
					value={value}
				>
					{(item) => <ComboboxItem id={item.name}>{item.name}</ComboboxItem>}
				</ComboboxField>
				<p>Selected: {value ?? 'None'}</p>
			</div>
		);
	},
});

/**
 * Infinite scroll composes a load-more row after the item renderer.
 */
export const AsyncInfiniteScroll = meta.story({
	render: function AsyncInfiniteScrollExample() {
		const [value, setValue] = useState<Key | null>(null);

		const list = useAsyncList<Pokemon>({
			async load({ cursor, signal }) {
				const res = await fetch(cursor || 'https://pokeapi.co/api/v2/pokemon', { signal });
				const json = await res.json();

				return {
					cursor: json.next,
					items: json.results,
				};
			},
		});

		return (
			<div style={stackStyle}>
				<ComboboxField
					items={list.items}
					label="Browse Pokemon"
					loadingState={list.loadingState}
					name="pokemon-infinite"
					onChange={setValue}
					onInputChange={(text) => list.setFilterText(text)}
					onLoadMore={() => list.loadMore()}
					placeholder="Search or browse Pokemon..."
					value={value}
				>
					{(item) => <ComboboxItem id={item.name}>{item.name}</ComboboxItem>}
				</ComboboxField>
				<p>Selected: {value ?? 'None'}</p>
			</div>
		);
	},
});

/**
 * Disabled keys prevent selection of specific options.
 * Disabled items cannot be selected, focused, or interacted with.
 */
export const DisabledKeys = meta.story({
	render: function Render() {
		return (
			<ComboboxField
				defaultItems={countryItems}
				description="Canada and Sweden are disabled"
				disabledKeys={['ca', 'se']}
				label="Country"
				name="disabled-keys"
				placeholder="Select a country..."
			>
				{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
			</ComboboxField>
		);
	},
});

/**
 * Invalid required fields use native validation by default and block form submission.
 */
export const Validation = meta.story({
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
		await expect(canvas.getByText('Please select a country.')).toBeInTheDocument();
	},
	render: function Render() {
		return (
			<Form>
				<div style={stackStyle}>
					<ComboboxField
						defaultItems={countryItems}
						errorMessage="Please select a country."
						isRequired
						label="Country"
						name="country"
					>
						{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
					</ComboboxField>
					<Button type="submit">Submit</Button>
				</div>
			</Form>
		);
	},
});

/**
 * Use `validationBehavior="aria"` to mark the field invalid for assistive technologies without blocking form submission.
 */
export const AriaValidation = meta.story({
	render: function Render() {
		return (
			<Form validationBehavior="native">
				<div style={stackStyle}>
					<ComboboxField
						defaultItems={countryItems}
						isRequired
						label="Required Field"
						name="required"
						placeholder="Select a country..."
						validationBehavior="aria"
					>
						{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
					</ComboboxField>
					<Button type="submit">Submit</Button>
				</div>
			</Form>
		);
	},
});

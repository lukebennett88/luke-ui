import { Button } from '@luke-ui/react/button';
import { ComboboxField } from '@luke-ui/react/combobox-field';
import { ComboboxItem, ComboboxSection } from '@luke-ui/react/combobox-field/primitive';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import type { Key } from 'react-aria-components/Breadcrumbs';
import { Form } from 'react-aria-components/Form';
import { useAsyncList } from 'react-aria-components/useAsyncList';
import { expect, userEvent, waitFor, within } from 'storybook/test';
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
 * Use `ComboboxField` when someone must choose one option from a large set.
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
 * Use uncontrolled mode when the component owns its initial value and items.
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

export const ClearSelection = meta.story({
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const page = within(document.body);
		const combobox = canvas.getByRole('combobox', { name: 'Country' });

		const clearButton = canvas.getByRole('button', { name: 'Clear selection' });
		await expect(combobox).toHaveValue('Canada');

		await userEvent.click(combobox);
		const selected = page.getByRole('option', { name: 'Canada' });
		await expect(selected).toHaveAttribute('aria-selected', 'true');
		await expect(selected.querySelector('svg')).not.toBeNull();

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
 * Use controlled mode when the parent owns the value and items.
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

/** Match the size of adjacent form controls. */
export const Size = meta.story({
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const page = within(document.body);

		const smallInput = canvas.getByRole('combobox', { name: 'Small' });
		const mediumInput = canvas.getByRole('combobox', { name: 'Medium (default)' });
		const smallControl = smallInput.closest('[role="group"]')!;
		const mediumControl = mediumInput.closest('[role="group"]')!;

		await expect(window.getComputedStyle(smallControl).blockSize).not.toBe(
			window.getComputedStyle(mediumControl).blockSize,
		);

		await userEvent.click(smallInput);
		const smallOptions = page.getAllByRole('option');
		await expect(smallOptions.length).toBeGreaterThan(0);
		const smallFirstOption = smallOptions[0]!;
		const smallOptionPadding = window.getComputedStyle(smallFirstOption).paddingBlock;

		await userEvent.keyboard('{Escape}');
		await userEvent.click(mediumInput);
		const mediumOptions = page.getAllByRole('option');
		await expect(mediumOptions.length).toBeGreaterThan(0);
		const mediumFirstOption = mediumOptions[0]!;
		const mediumOptionPadding = window.getComputedStyle(mediumFirstOption).paddingBlock;

		await expect(smallOptionPadding).not.toBe(mediumOptionPadding);

		await userEvent.keyboard('{Escape}');
		await userEvent.click(smallInput);
		const overrideOption = page.getByRole('option', { name: 'Override' });
		const overridePadding = window.getComputedStyle(overrideOption).paddingBlock;
		await expect(overridePadding).toBe(mediumOptionPadding);

		await userEvent.keyboard('{Escape}');
		await waitFor(async () => {
			await expect(page.queryByRole('listbox')).not.toBeInTheDocument();
		});
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

/** Group related options when a long list needs labelled sections. */
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
 * Pass asynchronous loading feedback through `listBoxProps`.
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
 * Compose a load-more row after the item renderer for incremental results.
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
 * Disabled options cannot receive focus or selection.
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
		const page = within(document.body);
		await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
		await expect(canvas.getByText('Please select a country.')).toBeInTheDocument();

		// Native validation focuses the invalid combobox and opens its listbox. Close the listbox so
		// the test does not leave the rest of the page hidden from assistive technology.
		await userEvent.keyboard('{Escape}');
		await waitFor(async () => {
			await expect(page.queryByRole('listbox')).not.toBeInTheDocument();
		});
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
 * Use `validationBehavior="aria"` to expose an invalid field to assistive technology without blocking form submission.
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

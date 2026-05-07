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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const page = within(document.body);
		const combobox = canvas.getByRole('combobox', { name: 'Country' });

		// Verify the combobox renders with expected structure.
		await expect(combobox).toBeInTheDocument();
		await expect(combobox).toHaveAttribute('aria-expanded', 'false');
		await expect(combobox).toHaveAttribute('placeholder', 'Select a country...');

		// Verify trigger button renders.
		await expect(canvas.getByRole('button', { name: /Toggle options/ })).toBeInTheDocument();

		// Clicking the input opens the popover.
		await userEvent.click(combobox);
		await expect(combobox).toHaveAttribute('aria-expanded', 'true');
		await expect(page.getByRole('option', { name: 'Australia' })).toBeInTheDocument();

		// Selecting an item closes the popover.
		await userEvent.click(page.getByRole('option', { name: 'Australia' }));
		await expect(combobox).toHaveValue('Australia');
		await expect(combobox).toHaveAttribute('aria-expanded', 'false');
	},
	render: function Render() {
		return (
			<ComboboxField
				description="Select where the user is located."
				defaultItems={countryItems}
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
					onInputChange={setInputValue}
					onChange={setValue}
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

/**
 * The input supports two sizes: small and medium (default).
 * Prefer using size consistently with other form controls.
 */
export const Size = meta.story({
	render: function Render() {
		return (
			<div style={stackStyle}>
				<ComboboxField
					defaultItems={countryItems}
					label="Small"
					name="small"
					placeholder="Small"
					size="small"
				>
					{(item) => <ComboboxItem size="small">{item.label}</ComboboxItem>}
				</ComboboxField>
				<ComboboxField
					defaultItems={countryItems}
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByRole('combobox', { name: 'Pick a Pokemon' })).toBeInTheDocument();
		await expect(canvas.getByRole('button', { name: /Toggle options/ })).toBeInTheDocument();
	},
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
					loadingState={list.loadingState}
					onInputChange={(text) => list.setFilterText(text)}
					value={value}
					onChange={setValue}
					label="Pick a Pokemon"
					name="pokemon"
					placeholder="Search for a Pokemon..."
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByRole('combobox', { name: 'Browse Pokemon' })).toBeInTheDocument();
		await expect(canvas.getByRole('button', { name: /Toggle options/ })).toBeInTheDocument();
	},
	render: function AsyncInfiniteScrollExample() {
		const [value, setValue] = useState<Key | null>(null);

		const list = useAsyncList<Pokemon>({
			async load({ cursor, signal }) {
				const res = await fetch(cursor || 'https://pokeapi.co/api/v2/pokemon', { signal });
				const json = await res.json();

				return {
					items: json.results,
					cursor: json.next,
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

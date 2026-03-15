import { Button } from '@luke-ui/react/actions/composed';
import { SelectItem, SelectSection } from '@luke-ui/react/forms';
import { SelectField } from '@luke-ui/react/forms/composed';
import type { CSSProperties, JSX } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { Key } from 'react-aria-components';
import { Form } from 'react-aria-components';
import { expect, userEvent, within } from 'storybook/test';
import preview from '../../../.storybook/preview.js';

const meta = preview.meta({
	component: SelectField,
	title: 'Forms/SelectField',
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

function AsyncItemsExample(): JSX.Element {
	const allItems = useMemo(() => countryItems, []);
	const [inputValue, setInputValue] = useState('');
	const [items, setItems] = useState<Array<CountryItem>>([]);

	useEffect(() => {
		if (!inputValue) {
			setItems([]);
			return;
		}

		const timeout = setTimeout(() => {
			const nextItems = allItems.filter((item) => {
				return item.label.toLowerCase().includes(inputValue.toLowerCase());
			});
			setItems(nextItems);
		}, 300);

		return () => clearTimeout(timeout);
	}, [allItems, inputValue]);

	return (
		<SelectField
			inputValue={inputValue}
			items={items}
			label="Search countries"
			name="search"
			onInputChange={setInputValue}
			placeholder="Type to search..."
		>
			{(item) => <SelectItem>{item.label}</SelectItem>}
		</SelectField>
	);
}

/**
 * Use the SelectField component when the user needs to choose one option from a large group of options.
 */
export const Default = meta.story({
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const page = within(document.body);
		const combobox = canvas.getByRole('combobox', { name: 'Country' });
		await expect(combobox).toBeInTheDocument();
		await userEvent.click(combobox);
		await userEvent.keyboard('{ArrowDown}');
		await expect(combobox).toHaveAttribute('aria-expanded', 'true');
		await userEvent.keyboard('{Escape}');
		await expect(combobox).toHaveAttribute('aria-expanded', 'false');
		await userEvent.click(canvas.getByRole('button'));
		await userEvent.click(page.getByRole('option', { name: 'Australia' }));
		await expect(combobox).toHaveValue('Australia');
	},
	render: () => (
		<SelectField
			description="Select where the user is located."
			label="Country"
			defaultItems={countryItems}
			name="country"
			placeholder="Select a country..."
		>
			{(item) => <SelectItem>{item.label}</SelectItem>}
		</SelectField>
	),
});

/**
 * Uncontrolled mode uses `defaultSelectedKey` and `defaultItems`.
 * The component manages its own state internally.
 */
export const Uncontrolled = meta.story({
	render: function Render() {
		return (
			<SelectField
				defaultItems={countryItems}
				defaultSelectedKey="ca"
				label="Uncontrolled Select"
				name="uncontrolled"
				placeholder="Select a country..."
			>
				{(item) => <SelectItem>{item.label}</SelectItem>}
			</SelectField>
		);
	},
});

/**
 * Controlled mode uses `selectedKey`, `onSelectionChange`, and `items`.
 * The parent component manages the state.
 */
export const Controlled = meta.story({
	render: function Render() {
		const [selectedKey, setSelectedKey] = useState<Key | null>('us');
		const [inputValue, setInputValue] = useState('');

		return (
			<div style={stackStyle}>
				<SelectField
					inputValue={inputValue}
					items={countryItems}
					label="Controlled Select"
					name="controlled"
					onInputChange={setInputValue}
					onSelectionChange={setSelectedKey}
					placeholder="Select a country..."
					selectedKey={selectedKey}
				>
					{(item) => <SelectItem>{item.label}</SelectItem>}
				</SelectField>
				<p>Selected: {selectedKey ?? 'None'}</p>
			</div>
		);
	},
});

/**
 * The input supports two sizes: small and medium (default).
 * Prefer using size consistently with other form controls.
 */
export const Size = meta.story({
	render: () => (
		<div style={stackStyle}>
			<SelectField
				defaultItems={countryItems}
				label="Small"
				name="small"
				placeholder="Small"
				size="small"
			>
				{(item) => <SelectItem size="small">{item.label}</SelectItem>}
			</SelectField>
			<SelectField
				defaultItems={countryItems}
				label="Medium (default)"
				name="medium"
				placeholder="Medium"
			>
				{(item) => <SelectItem>{item.label}</SelectItem>}
			</SelectField>
		</div>
	),
});

/**
 * Disabling the select input can be done via the disabled prop.
 */
export const Disabled = meta.story({
	render: () => (
		<SelectField
			defaultItems={countryItems}
			description="Temporarily unavailable"
			isDisabled
			label="Country"
			name="disabled"
			placeholder="Select a country..."
		>
			{(item) => <SelectItem>{item.label}</SelectItem>}
		</SelectField>
	),
});

/**
 * Groups are used to separate items into appropriate sections.
 * A divider is also included between each section.
 */
export const Groups = meta.story({
	render: () => (
		<SelectField label="Country" name="grouped" placeholder="Select a country...">
			<SelectSection id="north" title="Northern hemisphere">
				<SelectItem id="ca">Canada</SelectItem>
				<SelectItem id="us">United States</SelectItem>
				<SelectItem id="se">Sweden</SelectItem>
			</SelectSection>
			<SelectSection id="south" title="Southern hemisphere">
				<SelectItem id="au">Australia</SelectItem>
				<SelectItem id="nz">New Zealand</SelectItem>
			</SelectSection>
		</SelectField>
	),
});

/**
 * The SelectField can take both static and dynamic lists of items.
 * For example, you can pass items from an HTTP request and the select input will handle loading states while it awaits the async items.
 */
export const AsyncItems = meta.story({
	render: () => <AsyncItemsExample />,
});

/**
 * Disabled keys prevent selection of specific options.
 * Disabled items cannot be selected, focused, or interacted with.
 */
export const DisabledKeys = meta.story({
	render: () => (
		<SelectField
			defaultItems={countryItems}
			description="Canada and Sweden are disabled"
			disabledKeys={['ca', 'se']}
			label="Country"
			name="disabled-keys"
			placeholder="Select a country..."
		>
			{(item) => <SelectItem>{item.label}</SelectItem>}
		</SelectField>
	),
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
	render: () => (
		<Form>
			<div style={stackStyle}>
				<SelectField
					errorMessage="Please select a country."
					isRequired
					label="Country"
					name="country"
					defaultItems={countryItems}
				>
					{(item) => <SelectItem>{item.label}</SelectItem>}
				</SelectField>
				<Button type="submit">Submit</Button>
			</div>
		</Form>
	),
});

/**
 * Use `validationBehavior="aria"` to mark the field invalid for assistive technologies without blocking form submission.
 */
export const AriaValidation = meta.story({
	render: () => (
		<Form validationBehavior="native">
			<div style={stackStyle}>
				<SelectField
					isRequired
					label="Required Field"
					name="required"
					defaultItems={countryItems}
					placeholder="Select a country..."
					validationBehavior="aria"
				>
					{(item: CountryItem) => <SelectItem>{item.label}</SelectItem>}
				</SelectField>
				<Button type="submit">Submit</Button>
			</div>
		</Form>
	),
});

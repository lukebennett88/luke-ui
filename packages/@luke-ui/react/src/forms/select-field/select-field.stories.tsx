import { SelectItem, SelectSection } from '@luke-ui/react/forms';
import { SelectField } from '@luke-ui/react/forms/composed';
import type { CSSProperties, JSX } from 'react';
import { useEffect, useMemo, useState } from 'react';
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
 * Composed `SelectField` wires label, description, and validation messaging.
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
 * Size, disabled, and read-only states are forwarded to the underlying controls.
 */
export const States = meta.story({
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
				description="Temporarily unavailable"
				isDisabled
				label="Disabled"
				name="disabled"
				placeholder="Disabled"
			>
				{(item) => <SelectItem>{item.label}</SelectItem>}
			</SelectField>
			<SelectField
				defaultItems={countryItems}
				description="Value cannot be edited"
				isReadOnly
				label="Read-only"
				name="readonly"
				placeholder="Read-only"
			>
				{(item) => <SelectItem>{item.label}</SelectItem>}
			</SelectField>
		</div>
	),
});

/**
 * Grouped options are rendered with `SelectSection`.
 */
export const Groups = meta.story({
	render: () => (
		<SelectField label="Grouped countries" name="grouped" placeholder="Select a country...">
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
 * Async items are externally controlled and passed into `items`.
 */
export const AsyncItems = meta.story({
	render: () => <AsyncItemsExample />,
});

/**
 * Error messaging appears through the composed field wrapper.
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
				<button type="submit">Submit</button>
			</div>
		</Form>
	),
});

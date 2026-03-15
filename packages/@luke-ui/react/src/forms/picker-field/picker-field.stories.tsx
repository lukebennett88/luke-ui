import { SelectItem, SelectSection } from '@luke-ui/react/forms';
import { PickerField } from '@luke-ui/react/forms/composed';
import type { CSSProperties } from 'react';
import { Form } from 'react-aria-components';
import { expect, userEvent, within } from 'storybook/test';
import preview from '../../../.storybook/preview.js';

const meta = preview.meta({
	component: PickerField,
	title: 'Forms/PickerField',
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
 * Composed `PickerField` wraps non-searchable select behavior with field messaging.
 */
export const Default = meta.story({
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const page = within(document.body);
		await expect(canvas.getByLabelText('Country')).toBeInTheDocument();
		const trigger = canvas.getByRole('button');
		trigger.focus();
		await userEvent.keyboard('{ArrowDown}');
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');
		await userEvent.keyboard('{Escape}');
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await userEvent.click(trigger);
		await userEvent.click(page.getByRole('option', { name: 'Australia' }));
		await expect(trigger).toHaveTextContent('Australia');
	},
	render: () => (
		<PickerField<CountryItem>
			description="Select where the user is located."
			items={countryItems}
			label="Country"
			name="country"
			placeholder="Select a country..."
		>
			{(item) => <SelectItem>{item.label}</SelectItem>}
		</PickerField>
	),
});

/**
 * Sizes and disabled states are forwarded to the picker root.
 */
export const States = meta.story({
	render: () => (
		<div style={stackStyle}>
			<PickerField<CountryItem>
				items={countryItems}
				label="Small"
				name="small"
				placeholder="Small"
				size="small"
			>
				{(item) => <SelectItem size="small">{item.label}</SelectItem>}
			</PickerField>
			<PickerField<CountryItem>
				description="Temporarily unavailable"
				isDisabled
				items={countryItems}
				label="Disabled"
				name="disabled"
				placeholder="Disabled"
			>
				{(item) => <SelectItem>{item.label}</SelectItem>}
			</PickerField>
		</div>
	),
});

/**
 * Grouped options use `SelectSection` composition.
 */
export const Groups = meta.story({
	render: () => (
		<PickerField label="Grouped countries" name="grouped" placeholder="Select a country...">
			<SelectSection id="north" title="Northern hemisphere">
				<SelectItem id="ca">Canada</SelectItem>
				<SelectItem id="us">United States</SelectItem>
				<SelectItem id="se">Sweden</SelectItem>
			</SelectSection>
			<SelectSection id="south" title="Southern hemisphere">
				<SelectItem id="au">Australia</SelectItem>
				<SelectItem id="nz">New Zealand</SelectItem>
			</SelectSection>
		</PickerField>
	),
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
				<PickerField<CountryItem>
					errorMessage="Please select a country."
					isRequired
					items={countryItems}
					label="Country"
					name="country"
				>
					{(item) => <SelectItem>{item.label}</SelectItem>}
				</PickerField>
				<button type="submit">Submit</button>
			</div>
		</Form>
	),
});

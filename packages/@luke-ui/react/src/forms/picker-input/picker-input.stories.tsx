import {
	PickerInput,
	SelectInputGroup,
	SelectItem,
	SelectListBox,
	SelectPopover,
	SelectSection,
	SelectTrigger,
	SelectValue,
} from '@luke-ui/react/forms';
import { Icon } from '@luke-ui/react/visuals';
import type { CSSProperties } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import preview from '../../../.storybook/preview.js';

const meta = preview.meta({
	component: PickerInput,
	title: 'Forms/PickerInput (Primitive)',
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
 * Primitive picker composition for non-searchable select behavior.
 */
export const Default = meta.story({
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const page = within(document.body);
		const trigger = canvas.getByRole('button');
		trigger.focus();
		await userEvent.keyboard('{ArrowDown}');
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');
		await userEvent.keyboard('{Escape}');
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await userEvent.click(trigger);
		await expect(page.getByRole('option', { name: 'Australia' })).toBeInTheDocument();
		await userEvent.click(page.getByRole('option', { name: 'Australia' }));
		await expect(trigger).toHaveTextContent('Australia');
	},
	render: () => (
		<PickerInput<CountryItem> aria-label="Country" placeholder="Select a country...">
			<SelectInputGroup>
				<SelectTrigger>
					<SelectValue />
					<Icon aria-hidden name="chevronDown" size="small" />
				</SelectTrigger>
			</SelectInputGroup>
			<SelectPopover>
				<SelectListBox<CountryItem> items={countryItems}>
					{(item) => <SelectItem>{item.label}</SelectItem>}
				</SelectListBox>
			</SelectPopover>
		</PickerInput>
	),
});

/**
 * Size variants should match other field controls.
 */
export const Size = meta.story({
	render: () => (
		<div style={stackStyle}>
			<PickerInput<CountryItem> aria-label="Country (small)" placeholder="Small">
				<SelectInputGroup size="small">
					<SelectTrigger size="small">
						<SelectValue size="small" />
						<Icon aria-hidden name="chevronDown" size="xsmall" />
					</SelectTrigger>
				</SelectInputGroup>
				<SelectPopover>
					<SelectListBox<CountryItem> items={countryItems}>
						{(item) => <SelectItem size="small">{item.label}</SelectItem>}
					</SelectListBox>
				</SelectPopover>
			</PickerInput>
			<PickerInput<CountryItem> aria-label="Country (medium)" placeholder="Medium (default)">
				<SelectInputGroup>
					<SelectTrigger>
						<SelectValue />
						<Icon aria-hidden name="chevronDown" size="small" />
					</SelectTrigger>
				</SelectInputGroup>
				<SelectPopover>
					<SelectListBox<CountryItem> items={countryItems}>
						{(item) => <SelectItem>{item.label}</SelectItem>}
					</SelectListBox>
				</SelectPopover>
			</PickerInput>
		</div>
	),
});

/**
 * Grouped options use `SelectSection` composition.
 */
export const Groups = meta.story({
	render: () => (
		<PickerInput aria-label="Grouped countries" placeholder="Select a country...">
			<SelectInputGroup>
				<SelectTrigger>
					<SelectValue />
					<Icon aria-hidden name="chevronDown" size="small" />
				</SelectTrigger>
			</SelectInputGroup>
			<SelectPopover>
				<SelectListBox>
					<SelectSection id="north" title="Northern hemisphere">
						<SelectItem id="ca">Canada</SelectItem>
						<SelectItem id="us">United States</SelectItem>
						<SelectItem id="se">Sweden</SelectItem>
					</SelectSection>
					<SelectSection id="south" title="Southern hemisphere">
						<SelectItem id="au">Australia</SelectItem>
						<SelectItem id="nz">New Zealand</SelectItem>
					</SelectSection>
				</SelectListBox>
			</SelectPopover>
		</PickerInput>
	),
});

/**
 * Disabled and invalid states are forwarded from the root picker.
 */
export const States = meta.story({
	render: () => (
		<div style={stackStyle}>
			<PickerInput<CountryItem> aria-label="Disabled" isDisabled placeholder="Disabled">
				<SelectInputGroup>
					<SelectTrigger>
						<SelectValue />
						<Icon aria-hidden name="chevronDown" size="small" />
					</SelectTrigger>
				</SelectInputGroup>
			</PickerInput>
			<PickerInput<CountryItem> aria-label="Invalid" isInvalid placeholder="Invalid">
				<SelectInputGroup>
					<SelectTrigger>
						<SelectValue />
						<Icon aria-hidden name="chevronDown" size="small" />
					</SelectTrigger>
				</SelectInputGroup>
				<SelectPopover>
					<SelectListBox<CountryItem> items={countryItems}>
						{(item) => <SelectItem>{item.label}</SelectItem>}
					</SelectListBox>
				</SelectPopover>
			</PickerInput>
		</div>
	),
});

import {
	SelectInput,
	SelectInputGroup,
	SelectInputText,
	SelectItem,
	SelectListBox,
	SelectPopover,
	SelectSection,
	SelectTrigger,
} from '@luke-ui/react/forms';
import { Icon } from '@luke-ui/react/visuals';
import type { CSSProperties, JSX } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import preview from '../../../.storybook/preview.js';

const meta = preview.meta({
	component: SelectInput,
	title: 'Forms/SelectInput (Primitive)',
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
		<SelectInput
			aria-label="Search countries"
			inputValue={inputValue}
			onInputChange={setInputValue}
		>
			<SelectInputGroup>
				<SelectInputText placeholder="Type to search..." />
				<SelectTrigger aria-label="Toggle options">
					<Icon aria-hidden name="chevronDown" size="small" />
				</SelectTrigger>
			</SelectInputGroup>
			<SelectPopover>
				<SelectListBox items={items}>
					{(item) => <SelectItem>{item.label}</SelectItem>}
				</SelectListBox>
			</SelectPopover>
		</SelectInput>
	);
}

/**
 * Primitive combobox composition with Spectrum-style `value`/`onChange` APIs.
 */
export const Default = meta.story({
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const page = within(document.body);
		const combobox = canvas.getByRole('combobox', { name: 'Country' });
		await userEvent.click(combobox);
		await userEvent.keyboard('{ArrowDown}');
		await expect(combobox).toHaveAttribute('aria-expanded', 'true');
		await userEvent.keyboard('{Escape}');
		await expect(combobox).toHaveAttribute('aria-expanded', 'false');
		await userEvent.click(canvas.getByRole('button'));
		await expect(page.getByRole('option', { name: 'Australia' })).toBeInTheDocument();
		await userEvent.click(page.getByRole('option', { name: 'Australia' }));
		await expect(combobox).toHaveValue('Australia');
	},
	render: () => (
		<SelectInput aria-label="Country" defaultItems={countryItems}>
			<SelectInputGroup>
				<SelectInputText placeholder="Select a country..." />
				<SelectTrigger aria-label="Toggle options">
					<Icon aria-hidden name="chevronDown" size="small" />
				</SelectTrigger>
			</SelectInputGroup>
			<SelectPopover>
				<SelectListBox items={countryItems}>
					{(item) => <SelectItem>{item.label}</SelectItem>}
				</SelectListBox>
			</SelectPopover>
		</SelectInput>
	),
});

/**
 * Sizes should align with other Luke UI controls.
 */
export const Size = meta.story({
	render: () => (
		<div style={stackStyle}>
			<SelectInput aria-label="Country (small)" defaultItems={countryItems}>
				<SelectInputGroup size="small">
					<SelectInputText placeholder="Small" size="small" />
					<SelectTrigger aria-label="Toggle options" size="small">
						<Icon aria-hidden name="chevronDown" size="xsmall" />
					</SelectTrigger>
				</SelectInputGroup>
				<SelectPopover>
					<SelectListBox items={countryItems}>
						{(item) => <SelectItem size="small">{item.label}</SelectItem>}
					</SelectListBox>
				</SelectPopover>
			</SelectInput>
			<SelectInput aria-label="Country (medium)" defaultItems={countryItems}>
				<SelectInputGroup>
					<SelectInputText placeholder="Medium (default)" />
					<SelectTrigger aria-label="Toggle options">
						<Icon aria-hidden name="chevronDown" size="small" />
					</SelectTrigger>
				</SelectInputGroup>
				<SelectPopover>
					<SelectListBox items={countryItems}>
						{(item) => <SelectItem>{item.label}</SelectItem>}
					</SelectListBox>
				</SelectPopover>
			</SelectInput>
		</div>
	),
});

/**
 * Grouped options are composed with `SelectSection`.
 */
export const Groups = meta.story({
	render: () => (
		<SelectInput aria-label="Grouped countries">
			<SelectInputGroup>
				<SelectInputText placeholder="Select a country..." />
				<SelectTrigger aria-label="Toggle options">
					<Icon aria-hidden name="chevronDown" size="small" />
				</SelectTrigger>
			</SelectInputGroup>
			<SelectPopover>
				<SelectListBox items={countryItems}>
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
		</SelectInput>
	),
});

/**
 * Async data is managed externally and passed in as controlled `items`.
 */
export const AsyncItems = meta.story({
	render: () => <AsyncItemsExample />,
});

/**
 * Disabled and invalid states are controlled via root props.
 */
export const States = meta.story({
	render: () => (
		<div style={stackStyle}>
			<SelectInput aria-label="Disabled" defaultItems={countryItems} isDisabled>
				<SelectInputGroup>
					<SelectInputText placeholder="Disabled" />
					<SelectTrigger aria-label="Toggle options">
						<Icon aria-hidden name="chevronDown" size="small" />
					</SelectTrigger>
				</SelectInputGroup>
			</SelectInput>
			<SelectInput aria-label="Invalid" defaultItems={countryItems} isInvalid>
				<SelectInputGroup>
					<SelectInputText placeholder="Invalid" />
					<SelectTrigger aria-label="Toggle options">
						<Icon aria-hidden name="chevronDown" size="small" />
					</SelectTrigger>
				</SelectInputGroup>
				<SelectPopover>
					<SelectListBox items={countryItems}>
						{(item) => <SelectItem>{item.label}</SelectItem>}
					</SelectListBox>
				</SelectPopover>
			</SelectInput>
			<SelectInput aria-label="Read-only" defaultItems={countryItems} isReadOnly>
				<SelectInputGroup>
					<SelectInputText placeholder="Read-only" />
					<SelectTrigger aria-label="Toggle options">
						<Icon aria-hidden name="chevronDown" size="small" />
					</SelectTrigger>
				</SelectInputGroup>
			</SelectInput>
		</div>
	),
});

import {
	ComboboxControl,
	ComboboxEmptyState,
	ComboboxInput,
	ComboboxItem,
	ComboboxListBox,
	ComboboxLoadMoreItem,
	ComboboxPopover,
	ComboboxSection,
	ComboboxTextInput,
	ComboboxTrigger,
} from '@luke-ui/react/combobox';
import { Icon } from '@luke-ui/react/icon';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import type { Key } from 'react-aria-components/Breadcrumbs';
import { useAsyncList } from 'react-aria-components/useAsyncList';
import { expect, userEvent, within } from 'storybook/test';
import preview from '../.storybook/preview.js';

const meta = preview.meta({
	component: ComboboxInput,
	tags: ['forms'],
	title: 'Forms/ComboboxInput (Primitive)',
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
 * Primitive combobox composition with Spectrum-style `value`/`onChange` APIs.
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
			<ComboboxInput aria-label="Country" defaultItems={countryItems}>
				<ComboboxControl>
					<ComboboxTextInput placeholder="Select a country..." />
					<ComboboxTrigger aria-label="Toggle options">
						<Icon aria-hidden name="chevronDown" size="small" />
					</ComboboxTrigger>
				</ComboboxControl>
				<ComboboxPopover>
					<ComboboxListBox items={countryItems}>
						{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
					</ComboboxListBox>
				</ComboboxPopover>
			</ComboboxInput>
		);
	},
});

/**
 * Sizes should align with other Luke UI controls.
 */
export const Size = meta.story({
	render: function Render() {
		return (
			<div style={stackStyle}>
				<ComboboxInput aria-label="Country (small)" defaultItems={countryItems}>
					<ComboboxControl size="small">
						<ComboboxTextInput placeholder="Small" size="small" />
						<ComboboxTrigger aria-label="Toggle options" size="small">
							<Icon aria-hidden name="chevronDown" size="xsmall" />
						</ComboboxTrigger>
					</ComboboxControl>
					<ComboboxPopover>
						<ComboboxListBox items={countryItems}>
							{(item) => <ComboboxItem size="small">{item.label}</ComboboxItem>}
						</ComboboxListBox>
					</ComboboxPopover>
				</ComboboxInput>
				<ComboboxInput aria-label="Country (medium)" defaultItems={countryItems}>
					<ComboboxControl>
						<ComboboxTextInput placeholder="Medium (default)" />
						<ComboboxTrigger aria-label="Toggle options">
							<Icon aria-hidden name="chevronDown" size="small" />
						</ComboboxTrigger>
					</ComboboxControl>
					<ComboboxPopover>
						<ComboboxListBox items={countryItems}>
							{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
						</ComboboxListBox>
					</ComboboxPopover>
				</ComboboxInput>
			</div>
		);
	},
});

/**
 * Grouped options are composed with `ComboboxSection`.
 */
export const Groups = meta.story({
	render: function Render() {
		return (
			<ComboboxInput aria-label="Grouped countries">
				<ComboboxControl>
					<ComboboxTextInput placeholder="Select a country..." />
					<ComboboxTrigger aria-label="Toggle options">
						<Icon aria-hidden name="chevronDown" size="small" />
					</ComboboxTrigger>
				</ComboboxControl>
				<ComboboxPopover>
					<ComboboxListBox items={countryItems}>
						<ComboboxSection id="north" title="Northern hemisphere">
							<ComboboxItem id="ca">Canada</ComboboxItem>
							<ComboboxItem id="us">United States</ComboboxItem>
							<ComboboxItem id="se">Sweden</ComboboxItem>
						</ComboboxSection>
						<ComboboxSection id="south" title="Southern hemisphere">
							<ComboboxItem id="au">Australia</ComboboxItem>
							<ComboboxItem id="nz">New Zealand</ComboboxItem>
						</ComboboxSection>
					</ComboboxListBox>
				</ComboboxPopover>
			</ComboboxInput>
		);
	},
});

interface Pokemon {
	name: string;
}

/**
 * Async filtering keeps network state outside the primitive and renders
 * loading and empty states through the listbox.
 */
export const AsyncFiltering = meta.story({
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByRole('combobox', { name: 'Pick a Pokemon' })).toBeInTheDocument();
		await expect(canvas.getByRole('button', { name: 'Toggle options' })).toBeInTheDocument();
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
			<ComboboxInput
				aria-label="Pick a Pokemon"
				items={list.items}
				onInputChange={(text) => list.setFilterText(text)}
				value={value}
				onChange={setValue}
			>
				<ComboboxControl>
					<ComboboxTextInput placeholder="Search for a Pokemon..." />
					<ComboboxTrigger aria-label="Toggle options">
						<Icon aria-hidden name="chevronDown" size="small" />
					</ComboboxTrigger>
				</ComboboxControl>
				<ComboboxPopover>
					<ComboboxListBox
						renderEmptyState={() =>
							list.loadingState === 'loading' ? (
								<ComboboxEmptyState>
									<LoadingSpinner aria-label="Loading Pokemon..." size="medium" />
								</ComboboxEmptyState>
							) : (
								<ComboboxEmptyState>No results</ComboboxEmptyState>
							)
						}
					>
						{(item: Pokemon) => <ComboboxItem id={item.name}>{item.name}</ComboboxItem>}
					</ComboboxListBox>
				</ComboboxPopover>
			</ComboboxInput>
		);
	},
});

/**
 * Infinite scroll composes a load-more sentinel after the item renderer.
 */
export const AsyncInfiniteScroll = meta.story({
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByRole('combobox', { name: 'Browse Pokemon' })).toBeInTheDocument();
		await expect(canvas.getByRole('button', { name: 'Toggle options' })).toBeInTheDocument();
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
			<ComboboxInput
				aria-label="Browse Pokemon"
				items={list.items}
				onInputChange={(text) => list.setFilterText(text)}
				value={value}
				onChange={setValue}
			>
				<ComboboxControl>
					<ComboboxTextInput placeholder="Search or browse Pokemon..." />
					<ComboboxTrigger aria-label="Toggle options">
						<Icon aria-hidden name="chevronDown" size="small" />
					</ComboboxTrigger>
				</ComboboxControl>
				<ComboboxPopover>
					<ComboboxListBox
						loadMoreItem={
							<ComboboxLoadMoreItem
								isLoading={list.loadingState === 'loadingMore'}
								onLoadMore={() => list.loadMore()}
							>
								<LoadingSpinner aria-label="Loading more Pokemon..." size="small" />
							</ComboboxLoadMoreItem>
						}
						renderEmptyState={() =>
							list.loadingState === 'loading' ? (
								<ComboboxEmptyState>
									<LoadingSpinner aria-label="Loading Pokemon..." size="medium" />
								</ComboboxEmptyState>
							) : (
								<ComboboxEmptyState>No results</ComboboxEmptyState>
							)
						}
					>
						{(item: Pokemon) => <ComboboxItem id={item.name}>{item.name}</ComboboxItem>}
					</ComboboxListBox>
				</ComboboxPopover>
			</ComboboxInput>
		);
	},
});

/**
 * Disabled and invalid states are controlled via root props.
 */
export const States = meta.story({
	render: function Render() {
		return (
			<div style={stackStyle}>
				<ComboboxInput aria-label="Disabled" defaultItems={countryItems} isDisabled>
					<ComboboxControl>
						<ComboboxTextInput placeholder="Disabled" />
						<ComboboxTrigger aria-label="Toggle options">
							<Icon aria-hidden name="chevronDown" size="small" />
						</ComboboxTrigger>
					</ComboboxControl>
				</ComboboxInput>
				<ComboboxInput aria-label="Invalid" defaultItems={countryItems} isInvalid>
					<ComboboxControl>
						<ComboboxTextInput placeholder="Invalid" />
						<ComboboxTrigger aria-label="Toggle options">
							<Icon aria-hidden name="chevronDown" size="small" />
						</ComboboxTrigger>
					</ComboboxControl>
					<ComboboxPopover>
						<ComboboxListBox items={countryItems}>
							{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
						</ComboboxListBox>
					</ComboboxPopover>
				</ComboboxInput>
				<ComboboxInput aria-label="Read-only" defaultItems={countryItems} isReadOnly>
					<ComboboxControl>
						<ComboboxTextInput placeholder="Read-only" />
						<ComboboxTrigger aria-label="Toggle options">
							<Icon aria-hidden name="chevronDown" size="small" />
						</ComboboxTrigger>
					</ComboboxControl>
				</ComboboxInput>
			</div>
		);
	},
});

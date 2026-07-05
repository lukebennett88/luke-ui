import { ComboboxField } from '@luke-ui/react/combobox-field';
import { ComboboxItem } from '@luke-ui/react/combobox-field/primitive';
import type { JSX } from 'react';

type Country = { id: string; label: string };

const countries: Array<Country> = [
	{ id: 'au', label: 'Australia' },
	{ id: 'ca', label: 'Canada' },
	{ id: 'nz', label: 'New Zealand' },
	{ id: 'us', label: 'United States' },
];

export const meta = {
	title: 'Combobox Field — Basic',
	description: 'Single-select combobox with a static list of options.',
};

export default function Basic(): JSX.Element {
	return (
		<ComboboxField
			label="Country"
			name="country"
			placeholder="Select a country..."
			defaultItems={countries}
		>
			{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
		</ComboboxField>
	);
}

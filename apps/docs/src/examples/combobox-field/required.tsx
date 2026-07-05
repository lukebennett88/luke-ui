import { ComboboxField } from '@luke-ui/react/combobox-field';
import { ComboboxItem } from '@luke-ui/react/combobox-field/primitive';
import type { JSX } from 'react';

const items = [
	{ id: 'au', label: 'Australia' },
	{ id: 'ca', label: 'Canada' },
	{ id: 'nz', label: 'New Zealand' },
	{ id: 'us', label: 'United States' },
];

export const meta = {
	title: 'Combobox Field — Required',
	description: 'Required combobox with a necessity indicator.',
};

export default function Required(): JSX.Element {
	return (
		<ComboboxField
			isRequired
			label="Country"
			name="country"
			necessityIndicator="icon"
			defaultItems={items}
		>
			{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
		</ComboboxField>
	);
}

import { ComboboxField } from '@luke-ui/react/combobox-field';
import { ComboboxItem } from '@luke-ui/react/combobox-field/primitive';

type Country = { id: string; label: string };

const countries: Array<Country> = [
	{ id: 'au', label: 'Australia' },
	{ id: 'ca', label: 'Canada' },
	{ id: 'nz', label: 'New Zealand' },
	{ id: 'us', label: 'United States' },
];

export default function Basic() {
	return (
		<ComboboxField
			defaultItems={countries}
			label="Country"
			name="country"
			placeholder="Select a country..."
		>
			{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
		</ComboboxField>
	);
}

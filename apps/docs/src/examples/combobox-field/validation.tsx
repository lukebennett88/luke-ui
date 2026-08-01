import { ComboboxField } from '@luke-ui/react/combobox-field';
import { ComboboxItem } from '@luke-ui/react/combobox-field/primitive';

const countries = [
	{ id: 'australia', label: 'Australia' },
	{ id: 'canada', label: 'Canada' },
	{ id: 'new-zealand', label: 'New Zealand' },
	{ id: 'united-states', label: 'United States' },
];

export default function Validation() {
	return (
		<ComboboxField
			defaultItems={countries}
			errorMessage="Choose the country where you work."
			isInvalid
			label="Work location"
			name="country"
			placeholder="Choose a country"
		>
			{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
		</ComboboxField>
	);
}

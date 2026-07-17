import { ComboboxField } from '@luke-ui/react/combobox-field';
import { ComboboxItem } from '@luke-ui/react/combobox-field/primitive';

const countries = [
	{ id: 'australia', label: 'Australia' },
	{ id: 'canada', label: 'Canada' },
	{ id: 'new-zealand', label: 'New Zealand' },
	{ id: 'united-states', label: 'United States' },
];

export default function Required() {
	return (
		<ComboboxField
			defaultItems={countries}
			description="Choose the country where you work."
			isRequired
			label="Work location"
			name="workLocation"
			necessityIndicator="icon"
			placeholder="Choose a country"
		>
			{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
		</ComboboxField>
	);
}

import { ComboboxField } from '@luke-ui/react/combobox-field';
import { ComboboxItem } from '@luke-ui/react/combobox-field/primitive';

const items = [
	{ id: 'au', label: 'Australia' },
	{ id: 'ca', label: 'Canada' },
	{ id: 'nz', label: 'New Zealand' },
	{ id: 'us', label: 'United States' },
];

export default function Required() {
	return (
		<ComboboxField
			defaultItems={items}
			isRequired
			label="Country"
			name="country"
			necessityIndicator="icon"
		>
			{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
		</ComboboxField>
	);
}

import { SelectField, SelectItem } from '@luke-ui/react/select-field';

const countries = [
	{ id: 'australia', label: 'Australia' },
	{ id: 'canada', label: 'Canada' },
	{ id: 'new-zealand', label: 'New Zealand' },
];

export default () => {
	return (
		<SelectField
			description="Choose the country where you work."
			isRequired
			items={countries}
			label="Work location"
			name="workLocation"
			necessityIndicator="icon"
			placeholder="Choose a country"
		>
			{(item) => <SelectItem>{item.label}</SelectItem>}
		</SelectField>
	);
};

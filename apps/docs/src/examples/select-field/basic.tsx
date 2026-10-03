import { SelectField, SelectItem } from '@luke-ui/react/select-field';
import { Stack } from '@luke-ui/react/stack';

const themes = [
	{ id: 'system', label: 'System' },
	{ id: 'light', label: 'Light' },
	{ id: 'dark', label: 'Dark' },
];

export default () => {
	return (
		<Stack gap="sp16" maxInlineSize="20rem">
			<SelectField
				defaultValue="system"
				items={themes}
				label="Theme"
				name="theme"
				placeholder="Choose a theme"
			>
				{(item) => <SelectItem>{item.label}</SelectItem>}
			</SelectField>
		</Stack>
	);
};

import { Box } from '@luke-ui/react/box';
import { ComboboxField } from '@luke-ui/react/combobox-field';
import { ComboboxItem } from '@luke-ui/react/combobox-field/primitive';

type Fruit = { id: string; label: string };

const fruits: Array<Fruit> = [
	{ id: 'apple', label: 'Apple' },
	{ id: 'orange', label: 'Orange' },
	{ id: 'banana', label: 'Banana' },
	{ id: 'grape', label: 'Grape' },
];

export default function Basic() {
	return (
		<Box display="flex" flexDirection="column" gap="400" maxInlineSize="20rem">
			<ComboboxField
				defaultItems={fruits}
				defaultValue="apple"
				label="Favourite fruit"
				name="fruit"
				placeholder="Choose a fruit"
			>
				{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
			</ComboboxField>
		</Box>
	);
}

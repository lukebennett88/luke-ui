import { ComboboxField } from '@luke-ui/react/combobox-field';
import { ComboboxItem } from '@luke-ui/react/primitives/combobox';
import { Stack } from '@luke-ui/react/stack';

type Fruit = { id: string; label: string };

const fruits: Array<Fruit> = [
	{ id: 'apple', label: 'Apple' },
	{ id: 'orange', label: 'Orange' },
	{ id: 'banana', label: 'Banana' },
	{ id: 'grape', label: 'Grape' },
];

export default () => {
	return (
		<Stack gap="sp16" maxInlineSize="20rem" inlineSize="100%">
			<ComboboxField
				defaultItems={fruits}
				defaultValue="apple"
				label="Favourite fruit"
				name="fruit"
				placeholder="Choose a fruit"
			>
				{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
			</ComboboxField>
		</Stack>
	);
};

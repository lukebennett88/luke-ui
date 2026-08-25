import { Box } from '@luke-ui/react/box';
import { ComboboxField } from '@luke-ui/react/combobox-field';
import { ComboboxItem } from '@luke-ui/react/primitives/combobox';

type Fruit = { id: string; label: string };

const fruits: Array<Fruit> = [
	{ id: 'apple', label: 'Apple' },
	{ id: 'orange', label: 'Orange' },
	{ id: 'banana', label: 'Banana' },
	{ id: 'grape', label: 'Grape' },
];

export default () => {
	return (
		<Box display="flex" flexDirection="column" gap="sp16" maxInlineSize="20rem">
			<ComboboxField
				defaultItems={fruits}
				label="Favourite fruit"
				name="smallFruit"
				placeholder="Choose a fruit"
				size="small"
			>
				{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
			</ComboboxField>
			<ComboboxField
				defaultItems={fruits}
				label="Favourite fruit"
				name="mediumFruit"
				placeholder="Choose a fruit"
				size="medium"
			>
				{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
			</ComboboxField>
		</Box>
	);
};

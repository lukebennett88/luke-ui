import { Box } from '@luke-ui/react/box';
import { ComboboxField } from '@luke-ui/react/combobox-field';
import { ComboboxItem } from '@luke-ui/react/primitives/combobox';
import { Text } from '@luke-ui/react/text';

type Option = { id: string; label: string };

const options: Array<Option> = [
	{ id: 'one', label: 'Example option' },
	{ id: 'two', label: 'Another option' },
];

export default () => {
	return (
		<Box display="flex" flexDirection="column" gap="sp16" maxInlineSize="20rem">
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Small
				</Text>
				<ComboboxField
					defaultItems={options}
					label="Example field"
					name="example"
					placeholder="Choose an option"
					size="small"
				>
					{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
				</ComboboxField>
			</Box>
			<Box display="grid" gap="sp4">
				<Text color="secondary" typography="caption">
					Medium
				</Text>
				<ComboboxField
					defaultItems={options}
					label="Example field"
					name="example"
					placeholder="Choose an option"
					size="medium"
				>
					{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
				</ComboboxField>
			</Box>
		</Box>
	);
};

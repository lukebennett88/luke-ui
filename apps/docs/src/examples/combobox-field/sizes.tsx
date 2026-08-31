import { Box } from '@luke-ui/react/box';
import { ComboboxField } from '@luke-ui/react/combobox-field';
import { ComboboxItem } from '@luke-ui/react/primitives/combobox';
import { Comparison, ComparisonItem } from '#docs/comparison';

type Option = { id: string; label: string };

const options: Array<Option> = [
	{ id: 'one', label: 'Example option' },
	{ id: 'two', label: 'Another option' },
];

export default () => {
	return (
		<Box maxInlineSize="20rem">
			<Comparison direction="vertical">
				<ComparisonItem label="Small">
					<ComboboxField
						defaultItems={options}
						label="Example field"
						name="example"
						placeholder="Choose an option"
						size="small"
					>
						{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
					</ComboboxField>
				</ComparisonItem>
				<ComparisonItem label="Medium">
					<ComboboxField
						defaultItems={options}
						label="Example field"
						name="example"
						placeholder="Choose an option"
						size="medium"
					>
						{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
					</ComboboxField>
				</ComparisonItem>
			</Comparison>
		</Box>
	);
};

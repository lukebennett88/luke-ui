import { ComboboxField, ComboboxItem } from '@luke-ui/react/combobox-field';
import { Comparison, ComparisonItem } from '#docs';

type Option = { id: string; label: string };

const options: Array<Option> = [
	{ id: 'one', label: 'Example option' },
	{ id: 'two', label: 'Another option' },
];

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="px32">
				<ComboboxField
					defaultItems={options}
					label="Example field"
					name="example"
					placeholder="Choose an option"
					size="px32"
				>
					{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
				</ComboboxField>
			</ComparisonItem>
			<ComparisonItem label="px40">
				<ComboboxField
					defaultItems={options}
					label="Example field"
					name="example"
					placeholder="Choose an option"
					size="px40"
				>
					{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
				</ComboboxField>
			</ComparisonItem>
		</Comparison>
	);
};

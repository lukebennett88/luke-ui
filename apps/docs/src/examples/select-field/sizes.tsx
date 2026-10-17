import { SelectField, SelectItem } from '@luke-ui/react/select-field';
import { Comparison, ComparisonItem } from '#docs';

const options = [
	{ id: 'one', label: 'Example option' },
	{ id: 'two', label: 'Another option' },
];

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="px32">
				<SelectField
					items={options}
					label="Example field"
					name="example"
					placeholder="Choose an option"
					size="px32"
				>
					{(item) => <SelectItem>{item.label}</SelectItem>}
				</SelectField>
			</ComparisonItem>
			<ComparisonItem label="px40">
				<SelectField
					items={options}
					label="Example field"
					name="example"
					placeholder="Choose an option"
					size="px40"
				>
					{(item) => <SelectItem>{item.label}</SelectItem>}
				</SelectField>
			</ComparisonItem>
		</Comparison>
	);
};

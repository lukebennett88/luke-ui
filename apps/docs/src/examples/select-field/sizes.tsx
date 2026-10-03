import { SelectField, SelectItem } from '@luke-ui/react/select-field';
import { Comparison, ComparisonItem } from '#docs';

const options = [
	{ id: 'one', label: 'Example option' },
	{ id: 'two', label: 'Another option' },
];

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Small">
				<SelectField
					items={options}
					label="Example field"
					name="example"
					placeholder="Choose an option"
					size="small"
				>
					{(item) => <SelectItem>{item.label}</SelectItem>}
				</SelectField>
			</ComparisonItem>
			<ComparisonItem label="Medium">
				<SelectField
					items={options}
					label="Example field"
					name="example"
					placeholder="Choose an option"
					size="medium"
				>
					{(item) => <SelectItem>{item.label}</SelectItem>}
				</SelectField>
			</ComparisonItem>
		</Comparison>
	);
};

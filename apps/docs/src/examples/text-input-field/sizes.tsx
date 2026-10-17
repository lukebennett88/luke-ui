import { TextInputField } from '@luke-ui/react/text-input-field';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="px32">
				<TextInputField
					label="Example field"
					name="example"
					placeholder="Example input"
					size="px32"
				/>
			</ComparisonItem>
			<ComparisonItem label="px40">
				<TextInputField
					label="Example field"
					name="example"
					placeholder="Example input"
					size="px40"
				/>
			</ComparisonItem>
		</Comparison>
	);
};

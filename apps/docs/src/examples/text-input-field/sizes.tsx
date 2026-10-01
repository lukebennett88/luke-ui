import { TextInputField } from '@luke-ui/react/text-input-field';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Small">
				<TextInputField
					label="Example field"
					name="example"
					placeholder="Example input"
					size="small"
				/>
			</ComparisonItem>
			<ComparisonItem label="Medium">
				<TextInputField
					label="Example field"
					name="example"
					placeholder="Example input"
					size="medium"
				/>
			</ComparisonItem>
		</Comparison>
	);
};

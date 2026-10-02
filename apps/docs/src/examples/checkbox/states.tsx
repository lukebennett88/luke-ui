import { Checkbox } from '@luke-ui/react/checkbox';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Unchecked">
				<Checkbox label="Example checkbox" />
			</ComparisonItem>
			<ComparisonItem label="Checked">
				<Checkbox defaultSelected label="Example checkbox" />
			</ComparisonItem>
			<ComparisonItem label="Indeterminate">
				<Checkbox isIndeterminate label="Example checkbox" />
			</ComparisonItem>
			<ComparisonItem label="Disabled">
				<Checkbox isDisabled label="Example checkbox" />
			</ComparisonItem>
			<ComparisonItem label="Disabled and checked">
				<Checkbox defaultSelected isDisabled label="Example checkbox" />
			</ComparisonItem>
			<ComparisonItem label="Invalid">
				<Checkbox
					errorMessage="Select this example checkbox to continue."
					label="Example checkbox"
				/>
			</ComparisonItem>
		</Comparison>
	);
};

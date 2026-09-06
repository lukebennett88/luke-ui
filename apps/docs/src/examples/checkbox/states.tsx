import { Checkbox } from '@luke-ui/react/checkbox';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison direction="vertical">
			<ComparisonItem label="Unchecked">
				<Checkbox>Example checkbox</Checkbox>
			</ComparisonItem>
			<ComparisonItem label="Checked">
				<Checkbox defaultSelected>Example checkbox</Checkbox>
			</ComparisonItem>
			<ComparisonItem label="Indeterminate">
				<Checkbox isIndeterminate>Example checkbox</Checkbox>
			</ComparisonItem>
			<ComparisonItem label="Selected and indeterminate">
				<Checkbox defaultSelected isIndeterminate>
					Example checkbox
				</Checkbox>
			</ComparisonItem>
			<ComparisonItem label="Disabled">
				<Checkbox isDisabled>Example checkbox</Checkbox>
			</ComparisonItem>
			<ComparisonItem label="Disabled and checked">
				<Checkbox defaultSelected isDisabled>
					Example checkbox
				</Checkbox>
			</ComparisonItem>
			<ComparisonItem label="Invalid">
				<Checkbox errorMessage="Select this example checkbox to continue.">
					Example checkbox
				</Checkbox>
			</ComparisonItem>
		</Comparison>
	);
};

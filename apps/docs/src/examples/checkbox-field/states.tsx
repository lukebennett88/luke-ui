import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Unchecked">
				<CheckboxField label="Example checkbox" />
			</ComparisonItem>
			<ComparisonItem label="Checked">
				<CheckboxField defaultSelected label="Example checkbox" />
			</ComparisonItem>
			<ComparisonItem label="Indeterminate">
				<CheckboxField isIndeterminate label="Example checkbox" />
			</ComparisonItem>
			<ComparisonItem label="Disabled">
				<CheckboxField isDisabled label="Example checkbox" />
			</ComparisonItem>
			<ComparisonItem label="Disabled and checked">
				<CheckboxField defaultSelected isDisabled label="Example checkbox" />
			</ComparisonItem>
			<ComparisonItem label="Invalid">
				<CheckboxField
					errorMessage="Select this example checkbox to continue."
					label="Example checkbox"
				/>
			</ComparisonItem>
		</Comparison>
	);
};

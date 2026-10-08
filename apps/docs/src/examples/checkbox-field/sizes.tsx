import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Small">
				<CheckboxField defaultSelected label="Example checkbox" size="small" />
			</ComparisonItem>
			<ComparisonItem label="Medium">
				<CheckboxField defaultSelected label="Example checkbox" size="medium" />
			</ComparisonItem>
			<ComparisonItem label="Large">
				<CheckboxField defaultSelected label="Example checkbox" size="large" />
			</ComparisonItem>
		</Comparison>
	);
};

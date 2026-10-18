import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="small">
				<CheckboxField defaultSelected label="Example checkbox" size="small" />
			</ComparisonItem>
			<ComparisonItem label="medium">
				<CheckboxField defaultSelected label="Example checkbox" size="medium" />
			</ComparisonItem>
		</Comparison>
	);
};

import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="px16">
				<CheckboxField defaultSelected label="Example checkbox" size="px16" />
			</ComparisonItem>
			<ComparisonItem label="px20">
				<CheckboxField defaultSelected label="Example checkbox" size="px20" />
			</ComparisonItem>
			<ComparisonItem label="px24">
				<CheckboxField defaultSelected label="Example checkbox" size="px24" />
			</ComparisonItem>
		</Comparison>
	);
};

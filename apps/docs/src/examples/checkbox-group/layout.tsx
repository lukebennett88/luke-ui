import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { CheckboxGroup } from '@luke-ui/react/checkbox-group';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Vertical">
				<CheckboxGroup label="Days available">
					<CheckboxField label="Monday" value="monday" />
					<CheckboxField label="Tuesday" value="tuesday" />
					<CheckboxField label="Wednesday" value="wednesday" />
				</CheckboxGroup>
			</ComparisonItem>
			<ComparisonItem label="Horizontal">
				<CheckboxGroup label="Days available" orientation="horizontal">
					<CheckboxField label="Monday" value="monday" />
					<CheckboxField label="Tuesday" value="tuesday" />
					<CheckboxField label="Wednesday" value="wednesday" />
				</CheckboxGroup>
			</ComparisonItem>
		</Comparison>
	);
};

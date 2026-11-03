import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { CheckboxGroup } from '@luke-ui/react/checkbox-group';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Small">
				<CheckboxGroup label="Days available" size="small">
					<CheckboxField label="Monday" value="monday" />
					<CheckboxField label="Tuesday" value="tuesday" />
				</CheckboxGroup>
			</ComparisonItem>
			<ComparisonItem label="Medium">
				<CheckboxGroup label="Days available" size="medium">
					<CheckboxField label="Monday" value="monday" />
					<CheckboxField label="Tuesday" value="tuesday" />
				</CheckboxGroup>
			</ComparisonItem>
			<ComparisonItem label="Small group with a medium option">
				<CheckboxGroup label="Days available" size="small">
					<CheckboxField label="Monday" value="monday" />
					<CheckboxField label="Tuesday" size="medium" value="tuesday" />
				</CheckboxGroup>
			</ComparisonItem>
		</Comparison>
	);
};

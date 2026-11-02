import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { CheckboxGroup } from '@luke-ui/react/checkbox-group';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Small">
				<CheckboxGroup label="Example options" size="small">
					<CheckboxField label="First option" value="first" />
					<CheckboxField label="Second option" value="second" />
				</CheckboxGroup>
			</ComparisonItem>
			<ComparisonItem label="Medium">
				<CheckboxGroup label="Example options" size="medium">
					<CheckboxField label="First option" value="first" />
					<CheckboxField label="Second option" value="second" />
				</CheckboxGroup>
			</ComparisonItem>
			<ComparisonItem label="Small group with a medium option">
				<CheckboxGroup label="Example options" size="small">
					<CheckboxField label="First option" value="first" />
					<CheckboxField label="Second option" size="medium" value="second" />
				</CheckboxGroup>
			</ComparisonItem>
		</Comparison>
	);
};

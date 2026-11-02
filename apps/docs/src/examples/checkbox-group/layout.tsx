import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { CheckboxGroup } from '@luke-ui/react/checkbox-group';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Vertical">
				<CheckboxGroup label="Example options">
					<CheckboxField label="First option" value="first" />
					<CheckboxField label="Second option" value="second" />
				</CheckboxGroup>
			</ComparisonItem>
			<ComparisonItem label="Horizontal">
				<CheckboxGroup label="Example options" orientation="horizontal">
					<CheckboxField label="First option" value="first" />
					<CheckboxField label="Second option" value="second" />
				</CheckboxGroup>
			</ComparisonItem>
		</Comparison>
	);
};

import { RadioField, RadioGroup } from '@luke-ui/react/radio-group';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Small">
				<RadioGroup label="Example options" size="small">
					<RadioField label="First option" value="first" />
					<RadioField label="Second option" value="second" />
				</RadioGroup>
			</ComparisonItem>
			<ComparisonItem label="Medium">
				<RadioGroup label="Example options" size="medium">
					<RadioField label="First option" value="first" />
					<RadioField label="Second option" value="second" />
				</RadioGroup>
			</ComparisonItem>
			<ComparisonItem label="Small group with a medium option">
				<RadioGroup label="Example options" size="small">
					<RadioField label="First option" value="first" />
					<RadioField label="Second option" size="medium" value="second" />
				</RadioGroup>
			</ComparisonItem>
		</Comparison>
	);
};

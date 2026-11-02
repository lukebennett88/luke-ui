import { RadioField, RadioGroup } from '@luke-ui/react/radio-group';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Vertical">
				<RadioGroup label="Example options">
					<RadioField label="First option" value="first" />
					<RadioField label="Second option" value="second" />
				</RadioGroup>
			</ComparisonItem>
			<ComparisonItem label="Horizontal">
				<RadioGroup label="Example options" orientation="horizontal">
					<RadioField label="First option" value="first" />
					<RadioField label="Second option" value="second" />
				</RadioGroup>
			</ComparisonItem>
		</Comparison>
	);
};

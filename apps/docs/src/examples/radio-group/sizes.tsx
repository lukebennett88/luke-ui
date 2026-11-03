import { RadioField, RadioGroup } from '@luke-ui/react/radio-group';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Small">
				<RadioGroup label="Text alignment" size="small">
					<RadioField label="Left" value="left" />
					<RadioField label="Right" value="right" />
				</RadioGroup>
			</ComparisonItem>
			<ComparisonItem label="Medium">
				<RadioGroup label="Text alignment" size="medium">
					<RadioField label="Left" value="left" />
					<RadioField label="Right" value="right" />
				</RadioGroup>
			</ComparisonItem>
		</Comparison>
	);
};

import { RadioField, RadioGroup } from '@luke-ui/react/radio-group';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Vertical">
				<RadioGroup label="Text alignment">
					<RadioField label="Left" value="left" />
					<RadioField label="Centre" value="centre" />
					<RadioField label="Right" value="right" />
				</RadioGroup>
			</ComparisonItem>
			<ComparisonItem label="Horizontal">
				<RadioGroup label="Text alignment" orientation="horizontal">
					<RadioField label="Left" value="left" />
					<RadioField label="Centre" value="centre" />
					<RadioField label="Right" value="right" />
				</RadioGroup>
			</ComparisonItem>
		</Comparison>
	);
};

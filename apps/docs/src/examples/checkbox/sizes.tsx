import { Checkbox } from '@luke-ui/react/checkbox';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison direction="vertical">
			<ComparisonItem label="Small">
				<Checkbox defaultSelected size="small">
					Example checkbox
				</Checkbox>
			</ComparisonItem>
			<ComparisonItem label="Medium">
				<Checkbox defaultSelected size="medium">
					Example checkbox
				</Checkbox>
			</ComparisonItem>
			<ComparisonItem label="Large">
				<Checkbox defaultSelected size="large">
					Example checkbox
				</Checkbox>
			</ComparisonItem>
		</Comparison>
	);
};

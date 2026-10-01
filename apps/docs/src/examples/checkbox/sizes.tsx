import { Checkbox } from '@luke-ui/react/checkbox';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Small">
				<Checkbox defaultSelected label="Example checkbox" size="small" />
			</ComparisonItem>
			<ComparisonItem label="Medium">
				<Checkbox defaultSelected label="Example checkbox" size="medium" />
			</ComparisonItem>
			<ComparisonItem label="Large">
				<Checkbox defaultSelected label="Example checkbox" size="large" />
			</ComparisonItem>
		</Comparison>
	);
};

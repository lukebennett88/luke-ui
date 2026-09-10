import { IconButton } from '@luke-ui/react/icon-button';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Low">
				<IconButton aria-label="Add" icon="add" prominence="low" />
			</ComparisonItem>
			<ComparisonItem label="Standard">
				<IconButton aria-label="Add" icon="add" />
			</ComparisonItem>
			<ComparisonItem label="High">
				<IconButton aria-label="Add" icon="add" prominence="high" />
			</ComparisonItem>
		</Comparison>
	);
};

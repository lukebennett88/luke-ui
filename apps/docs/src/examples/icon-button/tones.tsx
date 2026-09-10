import { IconButton } from '@luke-ui/react/icon-button';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Neutral · Low">
				<IconButton aria-label="Add" icon="add" prominence="low" tone="neutral" />
			</ComparisonItem>
			<ComparisonItem label="Neutral · Standard">
				<IconButton aria-label="Add" icon="add" tone="neutral" />
			</ComparisonItem>
			<ComparisonItem label="Neutral · High">
				<IconButton aria-label="Add" icon="add" prominence="high" tone="neutral" />
			</ComparisonItem>
			<ComparisonItem label="Critical · Low">
				<IconButton aria-label="Delete" icon="delete" prominence="low" tone="critical" />
			</ComparisonItem>
			<ComparisonItem label="Critical · Standard">
				<IconButton aria-label="Delete" icon="delete" tone="critical" />
			</ComparisonItem>
			<ComparisonItem label="Critical · High">
				<IconButton aria-label="Delete" icon="delete" prominence="high" tone="critical" />
			</ComparisonItem>
		</Comparison>
	);
};

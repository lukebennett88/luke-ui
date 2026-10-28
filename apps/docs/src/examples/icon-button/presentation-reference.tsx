import { IconButton } from '@luke-ui/react/icon-button';
import { Comparison, ComparisonItem } from '#docs';

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
			<ComparisonItem label="Danger · Low">
				<IconButton aria-label="Delete" icon="delete" prominence="low" tone="danger" />
			</ComparisonItem>
			<ComparisonItem label="Danger · Standard">
				<IconButton aria-label="Delete" icon="delete" tone="danger" />
			</ComparisonItem>
			<ComparisonItem label="Danger · High">
				<IconButton aria-label="Delete" icon="delete" prominence="high" tone="danger" />
			</ComparisonItem>
		</Comparison>
	);
};

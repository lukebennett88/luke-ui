import { IconButton } from '@luke-ui/react/icon-button';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Neutral">
				<IconButton aria-label="Search" icon="search" tone="neutral" />
			</ComparisonItem>
			<ComparisonItem label="Accent">
				<IconButton aria-label="Add" icon="add" tone="accent" />
			</ComparisonItem>
			<ComparisonItem label="Critical">
				<IconButton aria-label="Delete" icon="delete" tone="critical" />
			</ComparisonItem>
		</Comparison>
	);
};

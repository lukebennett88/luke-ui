import { IconButton } from '@luke-ui/react/icon-button';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Neutral">
				<IconButton aria-label="Search" icon="search" tone="neutral" />
			</ComparisonItem>
			<ComparisonItem label="Danger">
				<IconButton aria-label="Delete" icon="delete" tone="danger" />
			</ComparisonItem>
		</Comparison>
	);
};

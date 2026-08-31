import { IconButton } from '@luke-ui/react/icon-button';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Neutral">
				<IconButton aria-label="Example action" icon="search" tone="neutral" />
			</ComparisonItem>
			<ComparisonItem label="Accent">
				<IconButton aria-label="Example action" icon="search" tone="accent" />
			</ComparisonItem>
			<ComparisonItem label="Danger">
				<IconButton aria-label="Example action" icon="search" tone="danger" />
			</ComparisonItem>
		</Comparison>
	);
};

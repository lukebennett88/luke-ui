import { IconLink } from '@luke-ui/react/icon-link';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Neutral">
				<IconLink aria-label="Search" href="/docs/installation" icon="search" tone="neutral" />
			</ComparisonItem>
			<ComparisonItem label="Accent">
				<IconLink aria-label="Add item" href="/docs/installation" icon="add" tone="accent" />
			</ComparisonItem>
			<ComparisonItem label="Critical">
				<IconLink
					aria-label="Delete item"
					href="/docs/installation"
					icon="delete"
					tone="critical"
				/>
			</ComparisonItem>
		</Comparison>
	);
};

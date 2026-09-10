import { IconLink } from '@luke-ui/react/icon-link';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="High">
				<IconLink
					aria-label="Open documentation"
					href="/docs/installation"
					icon="bookOpen"
					prominence="high"
					tone="accent"
				/>
			</ComparisonItem>
			<ComparisonItem label="Standard">
				<IconLink aria-label="Open documentation" href="/docs/installation" icon="bookOpen" />
			</ComparisonItem>
			<ComparisonItem label="Low">
				<IconLink
					aria-label="Open documentation"
					href="/docs/installation"
					icon="bookOpen"
					prominence="low"
				/>
			</ComparisonItem>
		</Comparison>
	);
};

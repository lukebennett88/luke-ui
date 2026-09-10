import { IconButton } from '@luke-ui/react/icon-button';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="High">
				<IconButton aria-label="Open documentation" icon="bookOpen" prominence="high" />
			</ComparisonItem>
			<ComparisonItem label="Standard">
				<IconButton aria-label="Open documentation" icon="bookOpen" />
			</ComparisonItem>
			<ComparisonItem label="Low">
				<IconButton aria-label="Open documentation" icon="bookOpen" prominence="low" />
			</ComparisonItem>
		</Comparison>
	);
};

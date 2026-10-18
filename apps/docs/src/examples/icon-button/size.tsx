import { IconButton } from '@luke-ui/react/icon-button';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="small">
				<IconButton aria-label="Example action" icon="search" size="small" />
			</ComparisonItem>
			<ComparisonItem label="medium">
				<IconButton aria-label="Example action" icon="search" size="medium" />
			</ComparisonItem>
		</Comparison>
	);
};

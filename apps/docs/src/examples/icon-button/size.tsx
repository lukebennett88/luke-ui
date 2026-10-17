import { IconButton } from '@luke-ui/react/icon-button';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="px32">
				<IconButton aria-label="Example action" icon="search" size="px32" />
			</ComparisonItem>
			<ComparisonItem label="px40">
				<IconButton aria-label="Example action" icon="search" size="px40" />
			</ComparisonItem>
		</Comparison>
	);
};

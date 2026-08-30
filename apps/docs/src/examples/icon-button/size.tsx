import { IconButton } from '@luke-ui/react/icon-button';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Small">
				<IconButton aria-label="Example action" icon="search" size="small" />
			</ComparisonItem>
			<ComparisonItem label="Medium">
				<IconButton aria-label="Example action" icon="search" size="medium" />
			</ComparisonItem>
		</Comparison>
	);
};

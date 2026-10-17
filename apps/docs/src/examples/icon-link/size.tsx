import { IconLink } from '@luke-ui/react/icon-link';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="px32">
				<IconLink aria-label="Search" href="/docs/installation" icon="search" size="px32" />
			</ComparisonItem>
			<ComparisonItem label="px40">
				<IconLink aria-label="Search" href="/docs/installation" icon="search" size="px40" />
			</ComparisonItem>
		</Comparison>
	);
};

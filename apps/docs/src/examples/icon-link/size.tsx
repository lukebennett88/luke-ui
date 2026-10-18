import { IconLink } from '@luke-ui/react/icon-link';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="small">
				<IconLink aria-label="Search" href="/docs/installation" icon="search" size="small" />
			</ComparisonItem>
			<ComparisonItem label="medium">
				<IconLink aria-label="Search" href="/docs/installation" icon="search" size="medium" />
			</ComparisonItem>
		</Comparison>
	);
};

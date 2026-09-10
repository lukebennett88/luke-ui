import { IconLink } from '@luke-ui/react/icon-link';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="Small">
				<IconLink aria-label="Search" href="/docs/installation" icon="search" size="small" />
			</ComparisonItem>
			<ComparisonItem label="Medium">
				<IconLink aria-label="Search" href="/docs/installation" icon="search" size="medium" />
			</ComparisonItem>
		</Comparison>
	);
};

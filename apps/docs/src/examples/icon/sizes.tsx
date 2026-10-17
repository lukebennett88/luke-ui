import { Icon } from '@luke-ui/react/icon';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison direction="horizontal">
			<ComparisonItem label="px16">
				<Icon name="search" size="px16" />
			</ComparisonItem>
			<ComparisonItem label="px20">
				<Icon name="search" size="px20" />
			</ComparisonItem>
			<ComparisonItem label="px24">
				<Icon name="search" size="px24" />
			</ComparisonItem>
			<ComparisonItem label="px32">
				<Icon name="search" size="px32" />
			</ComparisonItem>
		</Comparison>
	);
};

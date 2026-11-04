import { Icon } from '@luke-ui/react/icon';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison direction="horizontal">
			<ComparisonItem label="size.16">
				<Icon name="search" size="size.16" />
			</ComparisonItem>
			<ComparisonItem label="size.20">
				<Icon name="search" size="size.20" />
			</ComparisonItem>
			<ComparisonItem label="size.24">
				<Icon name="search" size="size.24" />
			</ComparisonItem>
			<ComparisonItem label="size.32">
				<Icon name="search" size="size.32" />
			</ComparisonItem>
		</Comparison>
	);
};

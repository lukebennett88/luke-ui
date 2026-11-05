import { Icon } from '@luke-ui/react/icon';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison direction="horizontal">
			<ComparisonItem label="xsmall">
				<Icon name="search" size="xsmall" />
			</ComparisonItem>
			<ComparisonItem label="small">
				<Icon name="search" size="small" />
			</ComparisonItem>
			<ComparisonItem label="medium">
				<Icon name="search" size="medium" />
			</ComparisonItem>
			<ComparisonItem label="large">
				<Icon name="search" size="large" />
			</ComparisonItem>
		</Comparison>
	);
};

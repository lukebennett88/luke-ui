import { Icon } from '@luke-ui/react/icon';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison direction="horizontal">
			<ComparisonItem label="X-small">
				<Icon name="search" size="xsmall" />
			</ComparisonItem>
			<ComparisonItem label="Small">
				<Icon name="search" size="small" />
			</ComparisonItem>
			<ComparisonItem label="Medium">
				<Icon name="search" size="medium" />
			</ComparisonItem>
			<ComparisonItem label="Large">
				<Icon name="search" size="large" />
			</ComparisonItem>
		</Comparison>
	);
};

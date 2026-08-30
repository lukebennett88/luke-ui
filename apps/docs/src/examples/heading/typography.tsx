import { Heading } from '@luke-ui/react/heading';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison direction="vertical">
			<ComparisonItem label="body">
				<Heading level={2} typography="body">
					Example heading
				</Heading>
			</ComparisonItem>
			<ComparisonItem label="lead">
				<Heading level={2} typography="lead">
					Example heading
				</Heading>
			</ComparisonItem>
			<ComparisonItem label="heading4">
				<Heading level={2} typography="heading4">
					Example heading
				</Heading>
			</ComparisonItem>
			<ComparisonItem label="heading3">
				<Heading level={2} typography="heading3">
					Example heading
				</Heading>
			</ComparisonItem>
			<ComparisonItem label="heading2">
				<Heading level={2} typography="heading2">
					Example heading
				</Heading>
			</ComparisonItem>
			<ComparisonItem label="heading1">
				<Heading level={2} typography="heading1">
					Example heading
				</Heading>
			</ComparisonItem>
			<ComparisonItem label="display">
				<Heading level={2} typography="display">
					Example heading
				</Heading>
			</ComparisonItem>
		</Comparison>
	);
};

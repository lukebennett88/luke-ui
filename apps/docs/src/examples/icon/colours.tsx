import { Icon } from '@luke-ui/react/icon';
import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Comparison direction="horizontal">
			<ComparisonItem label="Primary">
				<Text color="primary">
					<Icon name="checkCircle" />
				</Text>
			</ComparisonItem>
			<ComparisonItem label="Secondary">
				<Text color="secondary">
					<Icon name="checkCircle" />
				</Text>
			</ComparisonItem>
			<ComparisonItem label="Accent">
				<Text color="accent">
					<Icon name="checkCircle" />
				</Text>
			</ComparisonItem>
			<ComparisonItem label="Info">
				<Text color="info">
					<Icon name="checkCircle" />
				</Text>
			</ComparisonItem>
			<ComparisonItem label="Success">
				<Text color="success">
					<Icon name="checkCircle" />
				</Text>
			</ComparisonItem>
			<ComparisonItem label="Warning">
				<Text color="warning">
					<Icon name="checkCircle" />
				</Text>
			</ComparisonItem>
			<ComparisonItem label="Danger">
				<Text color="danger">
					<Icon name="checkCircle" />
				</Text>
			</ComparisonItem>
		</Comparison>
	);
};

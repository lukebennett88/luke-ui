import { Icon } from '@luke-ui/react/icon';
import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison align="center" direction="horizontal">
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
				<Text color="accent.rest">
					<Icon name="checkCircle" />
				</Text>
			</ComparisonItem>
			<ComparisonItem label="Info">
				<Text color="info.rest">
					<Icon name="checkCircle" />
				</Text>
			</ComparisonItem>
			<ComparisonItem label="Success">
				<Text color="success.rest">
					<Icon name="checkCircle" />
				</Text>
			</ComparisonItem>
			<ComparisonItem label="Warning">
				<Text color="warning.rest">
					<Icon name="checkCircle" />
				</Text>
			</ComparisonItem>
			<ComparisonItem label="Danger">
				<Text color="danger.rest">
					<Icon name="checkCircle" />
				</Text>
			</ComparisonItem>
		</Comparison>
	);
};

import { Button } from '@luke-ui/react/button';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Stack gap="space.24">
			<Stack gap="space.8">
				<Text typography="label">Button</Text>
				<Comparison>
					<ComparisonItem label="Neutral · Low">
						<Button prominence="low">Button</Button>
					</ComparisonItem>
					<ComparisonItem label="Neutral · Standard">
						<Button>Button</Button>
					</ComparisonItem>
					<ComparisonItem label="Neutral · High">
						<Button prominence="high">Button</Button>
					</ComparisonItem>
					<ComparisonItem label="Danger · Low">
						<Button prominence="low" tone="danger">
							Button
						</Button>
					</ComparisonItem>
					<ComparisonItem label="Danger · Standard">
						<Button tone="danger">Button</Button>
					</ComparisonItem>
					<ComparisonItem label="Danger · High">
						<Button prominence="high" tone="danger">
							Button
						</Button>
					</ComparisonItem>
				</Comparison>
			</Stack>
			<Stack gap="space.8">
				<Text typography="label">Text</Text>
				<Comparison>
					<ComparisonItem label="Neutral · Low">
						<Button appearance="text" prominence="low">
							Button
						</Button>
					</ComparisonItem>
					<ComparisonItem label="Neutral · Standard">
						<Button appearance="text">Button</Button>
					</ComparisonItem>
					<ComparisonItem label="Neutral · High">
						<Button appearance="text" prominence="high">
							Button
						</Button>
					</ComparisonItem>
					<ComparisonItem label="Danger · Low">
						<Button appearance="text" prominence="low" tone="danger">
							Button
						</Button>
					</ComparisonItem>
					<ComparisonItem label="Danger · Standard">
						<Button appearance="text" tone="danger">
							Button
						</Button>
					</ComparisonItem>
				</Comparison>
			</Stack>
		</Stack>
	);
};

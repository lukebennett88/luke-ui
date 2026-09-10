import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs/comparison';

export default () => {
	return (
		<Box display="grid" gap="sp24">
			<Box display="grid" gap="sp8">
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
					<ComparisonItem label="Critical · Low">
						<Button tone="critical" prominence="low">
							Button
						</Button>
					</ComparisonItem>
					<ComparisonItem label="Critical · Standard">
						<Button tone="critical">Button</Button>
					</ComparisonItem>
					<ComparisonItem label="Critical · High">
						<Button tone="critical" prominence="high">
							Button
						</Button>
					</ComparisonItem>
				</Comparison>
			</Box>
			<Box display="grid" gap="sp8">
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
					<ComparisonItem label="Critical · Low">
						<Button appearance="text" tone="critical" prominence="low">
							Button
						</Button>
					</ComparisonItem>
					<ComparisonItem label="Critical · Standard">
						<Button appearance="text" tone="critical">
							Button
						</Button>
					</ComparisonItem>
				</Comparison>
			</Box>
		</Box>
	);
};

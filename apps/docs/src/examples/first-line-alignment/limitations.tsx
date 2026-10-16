import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison direction="horizontal">
			<ComparisonItem label="A second block does not hang">
				<Stack gap="sp4" maxInlineSize="14rem">
					<Text fontWeight="emphasis" startContent={<Icon name="checkCircle" size="small" />}>
						Notification title
					</Text>
					<Text color="secondary" typography="caption">
						The description starts under the icon, not under the title.
					</Text>
				</Stack>
			</ComparisonItem>
			<ComparisonItem label="Centred text leaves a gap">
				<Box maxInlineSize="14rem">
					<Text
						elementType="p"
						startContent={<Icon name="checkCircle" size="small" />}
						textAlign="center"
					>
						Centred text that wraps onto two lines
					</Text>
				</Box>
			</ComparisonItem>
			<ComparisonItem label="A large icon moves small text down">
				<Box maxInlineSize="14rem">
					<Text elementType="p" startContent={<Icon name="checkCircle" />} typography="caption">
						Caption text beside a medium icon
					</Text>
				</Box>
			</ComparisonItem>
			<ComparisonItem label="Inline text does not hang">
				<Box maxInlineSize="14rem">
					<Text startContent={<Icon name="checkCircle" size="xsmall" />}>
						Inline text wraps under its adornment, like an icon in a sentence
					</Text>
				</Box>
			</ComparisonItem>
		</Comparison>
	);
};

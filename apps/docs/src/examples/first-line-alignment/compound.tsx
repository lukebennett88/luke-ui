import { Box } from '@luke-ui/react/box';
import { IconButton } from '@luke-ui/react/icon-button';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Track } from '@luke-ui/react/track';
import { Comparison, ComparisonItem } from '#docs';

const avatar = (
	<Box
		backgroundColor="neutral.subtle.rest"
		blockSize="2.5rem"
		borderRadius="full"
		display="inline-flex"
		elementType="span"
		inlineSize="2.5rem"
	/>
);

const dismiss = <IconButton aria-label="Dismiss" icon="close" prominence="low" size="small" />;

const content = (
	<Stack gap="sp4">
		<Text fontWeight="emphasis">Notification title</Text>
		<Text color="secondary" typography="caption">
			Description that may wrap onto a second line of text
		</Text>
	</Stack>
);

export default () => {
	return (
		<Comparison direction="horizontal">
			<ComparisonItem label="Current: firstLine">
				<Box maxInlineSize="18rem" paddingBlockStart="sp16">
					<Track gap="sp12" railAlignment="firstLine" railEnd={dismiss} railStart={avatar}>
						{content}
					</Track>
				</Box>
			</ComparisonItem>
			<ComparisonItem label="Current: start">
				<Box maxInlineSize="18rem" paddingBlockStart="sp16">
					<Track gap="sp12" railAlignment="start" railEnd={dismiss} railStart={avatar}>
						{content}
					</Track>
				</Box>
			</ComparisonItem>
			<ComparisonItem label="Current: center">
				<Box maxInlineSize="18rem" paddingBlockStart="sp16">
					<Track gap="sp12" railAlignment="center" railEnd={dismiss} railStart={avatar}>
						{content}
					</Track>
				</Box>
			</ComparisonItem>
		</Comparison>
	);
};

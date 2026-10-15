import { Box } from '@luke-ui/react/box';
import { IconButton } from '@luke-ui/react/icon-button';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Track } from '@luke-ui/react/track';

export default () => {
	return (
		<Box maxInlineSize="20rem">
			<Track
				gap="sp12"
				railAlignment="firstBaseline"
				railEnd={<IconButton aria-label="Dismiss" icon="close" prominence="low" size="small" />}
				railStart={
					<Box
						backgroundColor="neutral.subtle.rest"
						blockSize="2.5rem"
						borderRadius="full"
						display="inline-flex"
						elementType="span"
						inlineSize="2.5rem"
					/>
				}
			>
				<Stack gap="sp4">
					<Text fontWeight="emphasis">Example title</Text>
					<Text color="secondary" typography="caption">
						Example description that wraps onto a second line
					</Text>
				</Stack>
			</Track>
		</Box>
	);
};

import { Box } from '@luke-ui/react/box';
import { IconButton } from '@luke-ui/react/icon-button';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box maxInlineSize="22rem">
			<Text
				elementType="div"
				endContent={<IconButton aria-label="Dismiss" icon="close" prominence="low" size="small" />}
				gap="sp12"
				startContent={
					<Box
						aria-hidden="true"
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
					<Text fontWeight="emphasis">Notification title</Text>
					<Text color="secondary" typography="caption">
						Description that may wrap onto multiple lines
					</Text>
				</Stack>
			</Text>
		</Box>
	);
};

import { Box } from '@luke-ui/react/box';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { Track } from '@luke-ui/react/track';

export default () => {
	return (
		<Track
			gap="sp12"
			railAlignment="center"
			railStart={
				<Box
					backgroundColor="neutral.subtle.rest"
					blockSize="3rem"
					borderRadius="full"
					inlineSize="3rem"
				/>
			}
		>
			<Stack gap="sp4">
				<Text fontWeight="emphasis">Boricio Jones</Text>
				<Text typography="caption">Product designer</Text>
			</Stack>
		</Track>
	);
};

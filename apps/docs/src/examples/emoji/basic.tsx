import { Box } from '@luke-ui/react/box';
import { Emoji } from '@luke-ui/react/emoji';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box display="flex" flexDirection="column" gap="300">
			<Text>
				Deployment complete <Emoji emoji="🎉" label="Celebration" />
			</Text>
			<Emoji emoji="🚀" label="Rocket" typography="heading4" />
		</Box>
	);
};

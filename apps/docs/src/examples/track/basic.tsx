import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Track } from '@luke-ui/react/track';

export default () => {
	return (
		<Box maxInlineSize="18rem">
			<Track gap="sp8" railAlignment="firstLine" railStart={<Icon name="checkCircle" />}>
				Example message that wraps onto multiple lines when the available space is limited.
			</Track>
		</Box>
	);
};

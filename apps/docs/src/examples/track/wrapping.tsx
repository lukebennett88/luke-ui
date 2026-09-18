import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Track } from '@luke-ui/react/track';

export default () => {
	return (
		<Box display="grid" gap="sp16" maxInlineSize="20rem">
			<Track gap="sp8" railStart={<Icon name="checkCircle" />}>
				The report will be deleted after 24 hours unless you download a copy.
			</Track>
		</Box>
	);
};

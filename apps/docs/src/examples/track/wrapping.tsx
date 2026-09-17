import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Track } from '@luke-ui/react/track';

export default () => {
	return (
		<Box display="grid" gap="sp16" maxInlineSize="20rem">
			<Track gap="sp8" railStart={<Icon name="externalLink" />}>
				https://example.com/a/very/long/unbroken/path/segment/that/would/otherwise/overflow
			</Track>
			<Track gap="sp8" railStart={<Icon name="checkCircle" />}>
				Example item with enough text to wrap across more than one line inside a narrow container.
			</Track>
		</Box>
	);
};

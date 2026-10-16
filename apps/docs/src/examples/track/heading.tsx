import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { Icon } from '@luke-ui/react/icon';
import { Track } from '@luke-ui/react/track';

export default () => {
	return (
		<Box maxInlineSize="18rem">
			<Heading level={2}>
				<Track elementType="span" gap="sp8" railStart={<Icon name="search" />}>
					Example heading that wraps onto a second line
				</Track>
			</Heading>
		</Box>
	);
};

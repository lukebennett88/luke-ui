import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { Icon } from '@luke-ui/react/icon';

export default () => {
	return (
		<Box maxInlineSize="16rem">
			<Heading level={2} startContent={<Icon name="bookOpen" />} typography="heading3">
				Example heading that wraps
			</Heading>
		</Box>
	);
};

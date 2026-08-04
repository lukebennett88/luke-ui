import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box alignItems="center" display="flex" gap="100">
			<Text>Continue</Text>
			<Icon aria-hidden name="externalLink" size="xsmall" />
		</Box>
	);
};

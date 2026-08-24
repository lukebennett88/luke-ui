import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box display="flex" flexDirection="column" gap="sp12">
			<Text textTransform="uppercase">Project settings</Text>
			<Text textDecoration="underline">View all activity</Text>
		</Box>
	);
};

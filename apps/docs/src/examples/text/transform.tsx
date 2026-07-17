import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';

export default function Transform() {
	return (
		<Box display="flex" flexDirection="column" gap="300">
			<Text textTransform="uppercase">Project settings</Text>
			<Text textDecoration="underline">View all activity</Text>
		</Box>
	);
}

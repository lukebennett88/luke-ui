import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';

export default function Alignment() {
	return (
		<Box display="flex" flexDirection="column" gap="200">
			<Text elementType="div" textAlign="start">
				Start aligned
			</Text>
			<Text elementType="div" textAlign="center">
				Centre aligned
			</Text>
			<Text elementType="div" textAlign="end">
				End aligned
			</Text>
		</Box>
	);
}

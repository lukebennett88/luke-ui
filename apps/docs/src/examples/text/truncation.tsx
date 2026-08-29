import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box display="flex" flexDirection="column" gap="sp16" maxInlineSize="20rem">
			<Text elementType="div" lineClamp>
				Short lines are easier to scan than long ones, which is why well-set text rarely stretches
				edge to edge on a wide screen, no matter how much room is available.
			</Text>
			<Text elementType="div" lineClamp={2}>
				Short lines are easier to scan than long ones, which is why well-set text rarely stretches
				edge to edge on a wide screen, no matter how much room is available.
			</Text>
		</Box>
	);
};

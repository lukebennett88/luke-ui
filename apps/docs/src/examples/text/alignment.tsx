import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';

const rowStyle = {
	backgroundColor: vars.color.background.neutral.subtle.rest,
} as const;

export default () => {
	return (
		<Box display="flex" flexDirection="column" gap="sp8" inlineSize="100%">
			<Text elementType="p" style={rowStyle} textAlign="start">
				Start aligned
			</Text>
			<Text elementType="p" style={rowStyle} textAlign="center">
				Centre aligned
			</Text>
			<Text elementType="p" style={rowStyle} textAlign="end">
				End aligned
			</Text>
		</Box>
	);
};

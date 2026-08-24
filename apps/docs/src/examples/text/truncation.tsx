import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box display="flex" flexDirection="column" gap="sp16" maxInlineSize="20rem">
			<Text elementType="div" lineClamp>
				The weekly product update includes changes to reports, permissions, and saved views.
			</Text>
			<Text elementType="div" lineClamp={2}>
				The weekly product update includes changes to reports, permissions, and saved views.
			</Text>
		</Box>
	);
};

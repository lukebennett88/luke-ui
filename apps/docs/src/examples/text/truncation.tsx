import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';

export default function Truncation() {
	return (
		<Box display="flex" flexDirection="column" gap="400" maxInlineSize="20rem">
			<Text lineClamp>
				The weekly product update includes changes to reports, permissions, and saved views.
			</Text>
			<Text lineClamp={2}>
				The weekly product update includes changes to reports, permissions, and saved views.
			</Text>
			<Text shouldDisableTrim>Text with its full line box</Text>
		</Box>
	);
}

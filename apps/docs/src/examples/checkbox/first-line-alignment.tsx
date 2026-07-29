import { Box } from '@luke-ui/react/box';
import { Checkbox } from '@luke-ui/react/checkbox';
import { Text } from '@luke-ui/react/text';

export default function FirstLineAlignment() {
	return (
		<Box display="grid" gap="400" maxInlineSize="24rem">
			<Text elementType="div" size="100">
				<Checkbox>Small text wraps while the control stays centred on its first line.</Checkbox>
			</Text>
			<Text elementType="div" size="500">
				<Checkbox>Large text wraps while the control stays centred on its first line.</Checkbox>
			</Text>
		</Box>
	);
}

import { Box } from '@luke-ui/react/box';
import { Checkbox } from '@luke-ui/react/checkbox';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box display="grid" gap="400" maxInlineSize="18rem">
			<Text elementType="div" typography="caption">
				<Checkbox>A longer label keeps its control aligned when it wraps.</Checkbox>
			</Text>
			<Text elementType="div" typography="heading4">
				<Checkbox>Larger text keeps the same first-line alignment when it wraps.</Checkbox>
			</Text>
		</Box>
	);
};

import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box display="flex" flexDirection="column" gap="sp12">
			<Text textTransform="uppercase">Uppercase text</Text>
			<Text textDecoration="underline">Underlined text</Text>
		</Box>
	);
};

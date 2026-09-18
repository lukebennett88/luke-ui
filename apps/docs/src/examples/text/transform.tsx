import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Stack gap="sp12">
			<Text textTransform="uppercase">Uppercase text</Text>
			<Text textDecoration="underline">Underlined text</Text>
		</Stack>
	);
};

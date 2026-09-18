import { Heading } from '@luke-ui/react/heading';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Stack gap="sp12">
			<Heading>Account settings</Heading>
			<Text>Choose how this account appears to others.</Text>
		</Stack>
	);
};

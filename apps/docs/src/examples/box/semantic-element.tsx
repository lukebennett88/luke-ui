import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box aria-labelledby="account-settings-title" elementType="section" padding="400">
			<Heading id="account-settings-title">Account settings</Heading>
			<Text>Manage your profile and sign-in details.</Text>
		</Box>
	);
};

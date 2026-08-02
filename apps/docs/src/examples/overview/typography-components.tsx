import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { Text } from '@luke-ui/react/text';

export default function TypographyComponents() {
	return (
		<Box display="flex" flexDirection="column" gap="300">
			<Heading>Account settings</Heading>
			<Text>Choose how this account appears to others.</Text>
		</Box>
	);
}

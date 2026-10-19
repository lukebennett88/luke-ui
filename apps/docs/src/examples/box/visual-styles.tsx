import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box
			backgroundColor="success.subtle.rest"
			borderColor="decorative"
			borderRadius="control"
			borderStyle="solid"
			borderWidth="thin"
			boxShadow="resting"
			display="flex"
			flexDirection="column"
			gap="space.8"
			padding="space.16"
		>
			<Text fontWeight="label">Card heading</Text>
			<Text>Background, border, radius, and depth values applied together.</Text>
		</Box>
	);
};

import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box display="flex" flexDirection={{ initial: 'column', bp768: 'row' }} gap="space.12">
			<Item />
			<Item />
		</Box>
	);
};

function Item() {
	return (
		<Box
			alignItems="center"
			backgroundColor="neutral.solid"
			display="flex"
			flex={1}
			justifyContent="center"
			minBlockSize="4rem"
			padding="space.16"
		>
			<Text elementType="span" fontWeight="label">
				Item
			</Text>
		</Box>
	);
}

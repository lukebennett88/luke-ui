import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box display="flex" flexDirection={{ initial: 'column', bp640: 'row' }} gap="space.12">
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
			flexGrow="1"
			justifyContent="center"
			padding="space.16"
			style={{ minBlockSize: '4rem' }}
		>
			<Text elementType="span" fontWeight="label">
				Item
			</Text>
		</Box>
	);
}

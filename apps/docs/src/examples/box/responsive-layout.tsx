import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';

export default () => {
	return (
		<Box display="flex" flexDirection={{ initial: 'column', bp768: 'row' }} gap="sp12">
			<Item />
			<Item />
		</Box>
	);
};

function Item() {
	return (
		<Box
			alignItems="center"
			display="flex"
			justifyContent="center"
			padding="sp16"
			style={{
				backgroundColor: vars.color.background.neutral.solid.rest,
				flex: 1,
				minBlockSize: '4rem',
			}}
		>
			<Text
				elementType="span"
				fontWeight="label"
				style={{ color: vars.color.foreground.neutral.onSolid }}
			>
				Item
			</Text>
		</Box>
	);
}

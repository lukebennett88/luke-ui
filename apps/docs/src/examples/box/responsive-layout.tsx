import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';

export default function ResponsiveLayout() {
	return (
		<Box display="flex" flexDirection={{ initial: 'column', medium: 'row' }} gap="300">
			<Item />
			<Item />
		</Box>
	);
}

function Item() {
	return (
		<Box
			alignItems="center"
			display="flex"
			justifyContent="center"
			padding="400"
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

import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';

export default function ResponsiveLayout() {
	return (
		<Box display="flex" flexDirection={{ medium: 'row', xsmall: 'column' }} gap="300">
			<Box
				alignItems="center"
				display="flex"
				justifyContent="center"
				padding="400"
				style={{
					backgroundColor: vars.color.intent.neutral.surface.solid,
					flex: 1,
					minBlockSize: '4rem',
				}}
			>
				<Text
					elementType="span"
					fontWeight="label"
					style={{ color: vars.color.intent.neutral.onSolid }}
				>
					Item
				</Text>
			</Box>
			<Box
				alignItems="center"
				display="flex"
				justifyContent="center"
				padding="400"
				style={{
					backgroundColor: vars.color.intent.neutral.surface.solid,
					flex: 1,
					minBlockSize: '4rem',
				}}
			>
				<Text
					elementType="span"
					fontWeight="label"
					style={{ color: vars.color.intent.neutral.onSolid }}
				>
					Item
				</Text>
			</Box>
		</Box>
	);
}

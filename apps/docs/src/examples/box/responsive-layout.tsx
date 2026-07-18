import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';

export default function ResponsiveLayout() {
	return (
		<Box display="flex" flexDirection={{ medium: 'row', xsmall: 'column' }} gap="300">
			<Box
				padding="400"
				style={{ backgroundColor: vars.color.intent.accent.surface.solid, flex: 1 }}
			>
				<Text
					elementType="span"
					fontWeight="label"
					style={{ color: vars.color.intent.accent.onSolid }}
				>
					Summary
				</Text>
			</Box>
			<Box
				padding="400"
				style={{ backgroundColor: vars.color.intent.neutral.surface.solid, flex: 1 }}
			>
				<Text
					elementType="span"
					fontWeight="label"
					style={{ color: vars.color.intent.neutral.onSolid }}
				>
					Status
				</Text>
			</Box>
		</Box>
	);
}

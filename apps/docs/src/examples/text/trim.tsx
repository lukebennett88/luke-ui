import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';

const lineBoxStyle = {
	backgroundColor: vars.color.surface.recessed,
	borderBlock: `1px dashed ${vars.color.border.decorative}`,
} as const;

export default function Trim() {
	return (
		<Box display="flex" flexDirection="column" gap="400">
			<Box display="grid" gap="200">
				<Text color="secondary" elementType="div" size="100">
					Without trim
				</Text>
				<Box paddingInline="300" style={lineBoxStyle}>
					<Text elementType="div" shouldDisableTrim size="900">
						Aa
					</Text>
				</Box>
			</Box>
			<Box display="grid" gap="200">
				<Text color="secondary" elementType="div" size="100">
					With trim
				</Text>
				<Box paddingInline="300" style={lineBoxStyle}>
					<Text elementType="div" size="900">
						Aa
					</Text>
				</Box>
			</Box>
		</Box>
	);
}

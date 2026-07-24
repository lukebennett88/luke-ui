import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { deriveConcentricRadius, vars } from '@luke-ui/react/theme';
import { DecorativeBox } from './decorative-box.js';

export default function ConcentricRadiusExample() {
	const controlGap = vars.space[200];

	return (
		<Box display="grid" gap="200">
			<DecorativeBox
				display="grid"
				padding="200"
				style={{
					borderRadius: deriveConcentricRadius(vars.radius.control, controlGap),
				}}
			>
				<Box
					blockSize="6rem"
					inlineSize="100%"
					style={{
						backgroundColor: vars.color.surface.floating,
						borderRadius: vars.radius.control,
					}}
				/>
			</DecorativeBox>
			<Text size="100">Outer radius from inner radius + gap</Text>
		</Box>
	);
}

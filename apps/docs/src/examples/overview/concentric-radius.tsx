import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { deriveConcentricRadius, vars } from '@luke-ui/react/theme';
import { DecorativeBox } from './decorative-box.js';

export default () => {
	const controlGap = vars.space.sp8;

	return (
		<Box display="grid" gap="sp8">
			<DecorativeBox
				display="grid"
				padding="sp8"
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
			<Text typography="caption">Outer radius from inner radius + gap</Text>
		</Box>
	);
};

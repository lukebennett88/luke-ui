import { Box } from '@luke-ui/react/box';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { DecorativeBox } from './decorative-box.js';

export default () => {
	const controlGap = vars.space.sp8;

	return (
		<Stack gap="sp8">
			<DecorativeBox
				padding="sp8"
				style={{
					borderRadius: `calc(${vars.radius.control} + ${controlGap})`,
				}}
			>
				<Box
					blockSize="6rem"
					style={{
						backgroundColor: vars.color.surface.floating,
						borderRadius: vars.radius.control,
					}}
				/>
			</DecorativeBox>
			<Text typography="caption">Outer radius from inner radius + gap</Text>
		</Stack>
	);
};

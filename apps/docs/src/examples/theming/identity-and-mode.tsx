import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { themeRootClassName, vars } from '@luke-ui/react/theme';
import { tactileThemeClassName } from '@luke-ui/react/themes';
import { cx } from '@luke-ui/react/utils';

export default function IdentityAndModeExample() {
	return (
		<Box
			className={cx(themeRootClassName, tactileThemeClassName)}
			data-color-mode="light"
			display="grid"
			gap="600"
			padding="600"
			style={{
				backgroundColor: vars.color.surface.canvas,
				color: vars.color.text.primary,
			}}
		>
			<Box display="grid" gap="100">
				<Text elementType="strong" fontWeight="emphasis">
					Tactile, light mode
				</Text>
				<Text color="secondary" elementType="span" size="200">
					This root supplies the theme to its descendants.
				</Text>
			</Box>
			<Box
				data-color-mode="dark"
				display="grid"
				gap="100"
				padding="600"
				style={{
					backgroundColor: vars.color.surface.canvas,
					color: vars.color.text.primary,
				}}
			>
				<Text elementType="strong" fontWeight="emphasis">
					Nested dark mode
				</Text>
				<Text color="secondary" elementType="span" size="200">
					The identity remains Tactile while this scope changes mode.
				</Text>
			</Box>
		</Box>
	);
}

import { Stack } from '@luke-ui/react/stack';
import { vars } from '@luke-ui/react/theme';

const itemStyle = {
	backgroundColor: vars.color.surface.floating,
	border: `1px solid ${vars.color.border.decorative}`,
	borderRadius: vars.radius.detail,
	padding: vars.space.sp12,
} as const;

export default () => {
	return (
		<Stack alignItems="center" gap="sp12" inlineSize="100%">
			<span style={itemStyle}>Short item</span>
			<span style={itemStyle}>A wider item</span>
			<span style={itemStyle}>The widest item</span>
		</Stack>
	);
};

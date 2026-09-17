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
		<Stack gap="sp12" inlineSize="100%">
			<span style={itemStyle}>First block item</span>
			<span style={itemStyle}>Second block item</span>
			<span style={itemStyle}>Third block item</span>
		</Stack>
	);
};

import { Grid } from '@luke-ui/react/grid';
import { vars } from '@luke-ui/react/theme';

const itemStyle = {
	backgroundColor: vars.color.surface.floating,
	border: `1px solid ${vars.color.border.decorative}`,
	borderRadius: vars.radius.detail,
	padding: vars.space.sp12,
} as const;

export default () => {
	return (
		<Grid columns={2} elementType="ul" gap="sp12" inlineSize="100%">
			<li style={itemStyle}>First list item</li>
			<li style={itemStyle}>Second list item</li>
			<li style={itemStyle}>Third list item</li>
			<li style={itemStyle}>Fourth list item</li>
		</Grid>
	);
};

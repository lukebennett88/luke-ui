import { Box } from '@luke-ui/react/box';
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
		<Grid columns={{ initial: 2, bp768: 4 }} gap="sp12" inlineSize="100%">
			<Box gridColumn={{ initial: 'span 2', bp768: 'span 3' }} style={itemStyle}>
				Spans two columns initially, three from bp768
			</Box>
			<span style={itemStyle}>Second grid item</span>
			<span style={itemStyle}>Third grid item</span>
			<span style={itemStyle}>Fourth grid item</span>
		</Grid>
	);
};

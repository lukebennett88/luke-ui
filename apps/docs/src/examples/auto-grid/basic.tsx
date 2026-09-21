import { AutoGrid } from '@luke-ui/react/auto-grid';
import { vars } from '@luke-ui/react/theme';

const itemStyle = {
	backgroundColor: vars.color.surface.floating,
	border: `1px solid ${vars.color.border.decorative}`,
	borderRadius: vars.radius.detail,
	padding: vars.space.sp12,
} as const;

export default () => {
	return (
		<AutoGrid gap="sp12" minColumnInlineSize="12rem">
			<span style={itemStyle}>First grid item</span>
			<span style={itemStyle}>Second grid item</span>
			<span style={itemStyle}>Third grid item</span>
			<span style={itemStyle}>Fourth grid item</span>
			<span style={itemStyle}>Fifth grid item</span>
			<span style={itemStyle}>Sixth grid item</span>
		</AutoGrid>
	);
};

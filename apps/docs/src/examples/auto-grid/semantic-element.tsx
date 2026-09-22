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
		<AutoGrid elementType="ul" gap="sp12" inlineSize="100%" minColumnInlineSize="12rem">
			<li style={itemStyle}>First list item</li>
			<li style={itemStyle}>Second list item</li>
			<li style={itemStyle}>Third list item</li>
			<li style={itemStyle}>Fourth list item</li>
		</AutoGrid>
	);
};

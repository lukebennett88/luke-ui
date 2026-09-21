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
		<div style={{ inlineSize: '10rem' }}>
			<AutoGrid gap="sp12" minColumnInlineSize="16rem">
				<span style={itemStyle}>First grid item</span>
				<span style={itemStyle}>Second grid item</span>
			</AutoGrid>
		</div>
	);
};

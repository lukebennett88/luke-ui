import { Cluster } from '@luke-ui/react/cluster';
import { vars } from '@luke-ui/react/theme';

const itemStyle = {
	backgroundColor: vars.color.surface.floating,
	border: `1px solid ${vars.color.border.decorative}`,
	borderRadius: vars.radius.detail,
	padding: vars.space.sp8,
} as const;

export default () => {
	return (
		<Cluster gap="sp8" inlineSize="100%" maxInlineSize="16rem">
			<span style={itemStyle}>First item</span>
			<span style={itemStyle}>Second item</span>
			<span style={itemStyle}>Third item</span>
			<span style={itemStyle}>Fourth item</span>
			<span style={itemStyle}>Fifth item</span>
		</Cluster>
	);
};

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
		<Cluster alignItems="flex-end" gap="sp8" inlineSize="100%" justifyContent="space-between">
			<span style={itemStyle}>Short item</span>
			<span style={itemStyle}>
				A taller item
				<br />
				with two lines
			</span>
		</Cluster>
	);
};

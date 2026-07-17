import { Box } from '@luke-ui/react/box';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';

export default function ResponsiveLayout() {
	return (
		<Box
			alignItems={{ medium: 'center', xsmall: 'flex-start' }}
			display="flex"
			flexDirection={{ medium: 'row', xsmall: 'column' }}
			gap={{ medium: '800', xsmall: '400' }}
			justifyContent="space-between"
			padding={{ medium: '600', xsmall: '300' }}
			style={{
				backgroundColor: vars.color.surface.resting,
				border: `1px solid ${vars.color.border.decorative}`,
				borderRadius: vars.radius.surface,
				boxShadow: vars.depth.resting,
				color: vars.color.text.primary,
			}}
		>
			<Box display="flex" flexDirection="column" gap="100">
				<Text elementType="strong" fontWeight="emphasis">
					Quarterly product update
				</Text>
				<Text color="secondary" elementType="span">
					A summary for the team and stakeholders.
				</Text>
			</Box>
			<Box display="flex" flexDirection="column" gap="100">
				<Text color="secondary" elementType="span">
					Published
				</Text>
				<Text elementType="strong" fontWeight="emphasis">
					24 July 2026
				</Text>
			</Box>
		</Box>
	);
}

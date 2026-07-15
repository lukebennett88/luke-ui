import { Box } from '@luke-ui/react/box';
import { vars } from '@luke-ui/react/theme';

export default function ResponsiveLayout() {
	return (
		<Box
			display="flex"
			flexDirection={{ medium: 'row', xsmall: 'column' }}
			gap={{ medium: '600', xsmall: '200' }}
			padding={{ medium: '600', xsmall: '300' }}
			style={{ backgroundColor: vars.color.surface.recessed }}
		>
			<span>First item</span>
			<span>Second item</span>
		</Box>
	);
}

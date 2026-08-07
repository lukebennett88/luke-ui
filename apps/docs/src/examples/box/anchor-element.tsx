import { Box } from '@luke-ui/react/box';
import { vars } from '@luke-ui/react/theme';

export default () => {
	return (
		<Box
			elementType="a"
			href="#account-summary"
			padding="400"
			style={{ backgroundColor: vars.color.surface.recessed }}
		>
			Account summary
		</Box>
	);
};

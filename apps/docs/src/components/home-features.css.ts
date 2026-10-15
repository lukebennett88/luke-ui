import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

export const featureCell = style({
	'@layer': {
		components: {
			borderBlockStart: `1px solid ${vars.color.border.decorative}`,
			paddingBlockStart: vars.space.sp48,
		},
	},
});

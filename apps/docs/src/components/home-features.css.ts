import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

/** Hairline above each feature; padding stays on Stack. */
export const featureCell = style({
	'@layer': {
		components: {
			borderBlockStart: `1px solid ${vars.color.border.decorative}`,
		},
	},
});

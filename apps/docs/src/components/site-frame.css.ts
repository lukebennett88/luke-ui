import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

// The panel's surface contrast against the chrome draws its edge, so it has no border or shadow.
export const insetPanel = style({
	'@layer': {
		components: {
			borderStartEndRadius: vars.radius.surface,
			borderStartStartRadius: vars.radius.surface,
		},
	},
});

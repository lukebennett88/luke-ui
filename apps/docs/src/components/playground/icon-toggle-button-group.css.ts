import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

export const group = style({
	'@layer': {
		components: {
			alignItems: 'center',
			display: 'flex',
			gap: vars.space.sp8,
		},
	},
});

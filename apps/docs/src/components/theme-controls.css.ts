import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

export const root = style({
	'@layer': {
		components: {
			color: vars.color.text.primary,
			display: 'flex',
			flex: '1 1 auto',
			flexDirection: 'column',
			minBlockSize: '100dvh',
		},
	},
});

export const controls = style({
	'@layer': {
		components: {
			alignItems: 'center',
			display: 'flex',
			gap: vars.space.sp4,
		},
	},
});

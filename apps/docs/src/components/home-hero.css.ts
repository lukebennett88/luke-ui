import { style } from '@vanilla-extract/css';

export const hero = style({
	'@layer': {
		components: {
			alignItems: 'center',
		},
	},
});

/** Pin theme controls to the start of the demo panel's grid track. */
export const themeControls = style({
	'@layer': {
		components: {
			justifySelf: 'start',
		},
	},
});

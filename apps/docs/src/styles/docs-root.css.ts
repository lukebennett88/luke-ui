import { style } from '@vanilla-extract/css';

export const docsRoot = style({
	'@layer': {
		base: {
			display: 'flex',
			flexDirection: 'column',
			minBlockSize: '100dvh',
		},
	},
});

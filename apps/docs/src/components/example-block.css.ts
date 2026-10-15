import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

/** Concentric with the frame's `borderRadius="control"` after the 1px border. */
const INNER_RADIUS = `max(0px, calc(${vars.radius.control} - 1px))`;

export const frame = style({
	'@layer': {
		components: {
			isolation: 'isolate',
		},
	},
});

export const frameHeader = style({
	'@layer': {
		components: {
			borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
			borderStartEndRadius: INNER_RADIUS,
			borderStartStartRadius: INNER_RADIUS,
		},
	},
});

export const frameBody = style({
	'@layer': {
		components: {
			borderEndEndRadius: INNER_RADIUS,
			borderEndStartRadius: INNER_RADIUS,
		},
	},
});

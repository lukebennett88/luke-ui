import { style } from '@vanilla-extract/css';

/** Match the former Tailwind `max-w-xl` lead measure. */
export const lead = style({
	'@layer': {
		components: {
			maxInlineSize: '36rem',
		},
	},
});

import { style } from '@vanilla-extract/css';

/**
 * Default preview height. It sits in `base`, below the `components` layer, so a host such as the
 * playground preview runner can still reset it, as it could when this was a Box utility.
 */
export const minimumHeight = style({
	'@layer': {
		base: {
			minBlockSize: '6rem',
		},
	},
});

/** A narrow preview for single-column forms and short text. Example source needs no width wrapper. */
export const narrowPreview = style({
	'@layer': {
		base: {
			maxInlineSize: '20rem',
		},
	},
});

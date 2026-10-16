import { style } from '@vanilla-extract/css';

/**
 * UA list markers and indent. Docs chrome and layout examples that use `ul`/`ol` for structure
 * need this locally now that Tailwind Preflight is gone. Box has no `listStyle` prop.
 */
export const plainList = style({
	'@layer': {
		components: {
			listStyle: 'none',
		},
	},
});

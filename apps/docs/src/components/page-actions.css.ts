import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

/** Sizes a brand mark that is a plain `svg` and so takes no size from its button. */
export const brandMark = style({
	'@layer': {
		recipes: {
			blockSize: vars.iconSize.xsmall,
			flexShrink: 0,
			inlineSize: vars.iconSize.xsmall,
		},
	},
});

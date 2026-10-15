import { vars } from '../../theme/contract.css.js';
import { globalStyleInLayer, style } from '../styles/layered-style.css.js';
import { recipe } from '../styles/recipe.js';
import { lineClampVariants, textElementClassName } from './recipe.css.js';

/**
 * Lays out `startContent`, the text, and `endContent` in one row. Rows align on their first
 * baseline, so each adornment's line lines up with the text's first line, and a taller adornment
 * grows the row instead of overflowing it.
 *
 * A block `Text` keeps its element, and its Capsize trim boxes, outside this row. An inline `Text`
 * has no trim boxes, so the root element is the row.
 */
export const textAdornmentRow = recipe({
	base: {
		alignItems: 'first baseline',
		gap: vars.space.sp8,
		minInlineSize: 0,
	},
	defaultVariants: {
		isInline: false,
	},
	variants: {
		isInline: {
			false: { display: 'flex' },
			true: { display: 'inline-flex', maxInlineSize: '100%' },
		},
	},
});

/**
 * An adornment slot. It inherits the text's typography, so its line box matches the text's first
 * line and gives the row the baseline to align.
 */
export const textAdornment = style({ flexShrink: 0 }, 'text-adornment');

// Centres a graphic, such as an icon, on the cap height of the slot's line. `middle` centres the
// margin box on the x-height. The bottom margin moves the graphic up by half the difference between
// the cap height and the x-height, so it suits any font, and the line box still contains it. Text
// adornments, such as `Kbd`, keep their own alignment. Without `cap` unit support, the margin is
// dropped and the graphic stays centred on the x-height.
globalStyleInLayer(
	'recipes',
	`:where(.${textAdornment}) > :where(:not(.${textElementClassName}))`,
	{
		marginBlockEnd: 'calc(1cap - 1ex)',
		verticalAlign: 'middle',
	},
);

/** The text between the adornments. It takes the remaining space and can shrink below its words. */
export const textAdornedContent = recipe({
	base: {
		flexBasis: 'auto',
		flexGrow: 1,
		flexShrink: 1,
		minInlineSize: 0,
	},
	defaultVariants: {
		lineClamp: false,
	},
	variants: {
		lineClamp: lineClampVariants,
	},
});

import { createVar } from '@vanilla-extract/css';
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
 * The difference between the cap height and the x-height of the slot's font. A registered length
 * resolves on the slot, so a graphic with its own font size, such as an `IconButton`, still moves by
 * the slot's metrics.
 */
const capOffset = createVar({
	inherits: true,
	initialValue: '0px',
	syntax: '<length>',
});

/**
 * An adornment slot. It inherits the text's typography, so its line box matches the text's first
 * line and gives the row the baseline to align.
 */
export const textAdornment = style(
	{ flexShrink: 0, vars: { [capOffset]: 'calc(1cap - 1ex)' } },
	'text-adornment',
);

// Centres a graphic, such as an icon, on the cap height of the slot's line. `middle` centres the
// margin box on the x-height. A bottom margin of `capOffset` moves the graphic up by half of it, so
// it suits any font, and the line box still contains the graphic. Text
// adornments, such as `Kbd`, keep their own alignment. Without `cap` unit support, the offset
// falls back to its initial `0px` and the graphic stays centred on the x-height.
globalStyleInLayer(
	'recipes',
	`:where(.${textAdornment}) > :where(:not(.${textElementClassName}))`,
	{
		marginBlockEnd: capOffset,
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

import { vars } from '../../theme/contract.css.js';
import { style } from '../styles/layered-style.css.js';
import { recipe } from '../styles/recipe.js';

/**
 * Centres one adornment on the capitals of the line it sits on. Every adornment gets this box, so
 * an icon, a `Kbd`, and plain text all align the same way, whatever they contain.
 *
 * `middle` centres the box on the x-height of the surrounding font. A bottom margin of the
 * difference between the cap height and the x-height moves it up by half of that, so it suits any
 * font. The box inherits the text's font, so content with its own font size does not change the
 * offset. Without `cap` unit support the margin is dropped and the box centres on the x-height.
 */
export const textAdornment = recipe({
	base: {
		alignItems: 'center',
		display: 'inline-flex',
		flexShrink: 0,
		marginBlockEnd: 'calc(1cap - 1ex)',
		verticalAlign: 'middle',
	},
	defaultVariants: {
		inlineSide: 'none',
	},
	variants: {
		// Inline Text has no row gap, so the box spaces itself from the text.
		inlineSide: {
			end: { marginInlineStart: vars.space.sp4 },
			none: {},
			start: { marginInlineEnd: vars.space.sp4 },
		},
	},
});

/**
 * Lays out the adornments and the text of a block `Text` in one row, inside its Capsize trim boxes.
 * The row aligns on first baselines, so each adornment's line lines up with the text's first line,
 * and an adornment taller than the line grows the row instead of overflowing it.
 */
export const textAdornmentRow = style(
	{
		alignItems: 'first baseline',
		display: 'flex',
		gap: vars.space.sp8,
		minInlineSize: 0,
	},
	'text-adornment-row',
);

/**
 * Holds one adornment box in a block `Text` row. It inherits the text's typography, so its line
 * matches the text's first line and gives the row the baseline to align.
 */
export const textAdornmentSlot = style({ flexShrink: 0 }, 'text-adornment-slot');

/**
 * The text between the adornments in a block `Text` row. It takes the remaining space and can
 * shrink below its words. `Text` adds `textRecipe` classes that inherit the root's font, so a line
 * clamp reuses Text's own clamp rules.
 */
export const textAdornedContent = style(
	{
		flexBasis: 'auto',
		flexGrow: 1,
		flexShrink: 1,
		minInlineSize: 0,
	},
	'text-adorned-content',
);

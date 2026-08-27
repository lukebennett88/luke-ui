import type { StyleRule } from '@vanilla-extract/css';
import { iconMaskUrls } from '../../../.generated/icon-mask-data.js';
import { vars } from '../../theme/contract.css.js';

/** Renders the `exclamationTriangle` icon as a CSS mask `::before`/`::after`, at `size`. */
function invalidIconMask(size: string) {
	return {
		backgroundColor: vars.color.foreground.danger.rest,
		blockSize: size,
		content: '""',
		flexShrink: 0,
		inlineSize: size,
		maskImage: iconMaskUrls.exclamationTriangle,
		maskPosition: 'center',
		maskRepeat: 'no-repeat',
		maskSize: 'contain',
		// `satisfies` (not a `StyleRule` return type) keeps the inferred literal type
		// narrow for callers spreading this into an exported recipe config.
	} satisfies StyleRule;
}

/**
 * In-control invalid icon for `Combobox`, rendered as a `::after` inside the control
 * and reordered ahead of trailing affordances (`clearButton`/`trigger`) with flex
 * `order` in `primitives/combobox/styles.css.ts`. No `marginInlineStart`: the control's own
 * `paddingInlineEnd` already supplies the leading gap, so a margin here would double
 * it. `size` matches the recipe's `small`/`medium` control-size variants.
 */
export function invalidIndicatorIcon(size: string) {
	return {
		...invalidIconMask(size),
		marginInlineEnd: vars.space.sp4,
	} satisfies StyleRule;
}

/**
 * Forced-colours override shared by `invalidIndicatorIcon` and `invalidMessageIcon`.
 * Merge into the consuming recipe's own `(forced-colors: active)` block. `CanvasText`
 * keeps the icon solid and high-contrast when author colours are ignored.
 */
export const invalidIndicatorIconForcedColors = {
	backgroundColor: 'CanvasText',
} satisfies StyleRule;

/** Gap between `invalidMessageIcon` and the message text that follows it. */
const invalidMessageIconGap = vars.space.sp8;

/**
 * Leading icon for the shared `Field` error message (`primitives/field/recipe.css.ts`'s `message`
 * slot), switched on there by the `fieldMessageIcon` var. `indent` is
 * `primitives/field/recipe.css.ts`'s `fieldMessageIndent`: the icon's `inlineSize` plus
 * `marginInlineEnd` must equal it exactly so text resumes at the label's left edge.
 * `max()` floors `inlineSize` at the icon's own size so a consumer that enables the
 * icon without setting `fieldMessageIndent` doesn't collapse the box to nothing.
 * `textIndent: 0` cancels the negative indent `primitives/field/recipe.css.ts` applies to the message
 * itself so it doesn't also shift this icon.
 */
export function invalidMessageIcon(indent: string) {
	return {
		...invalidIconMask(vars.iconSize.xsmall),
		inlineSize: `max(calc(${indent} - ${invalidMessageIconGap}), ${vars.iconSize.xsmall})`,
		marginInlineEnd: invalidMessageIconGap,
		maskSize: vars.iconSize.xsmall,
		textIndent: 0,
		verticalAlign: 'middle',
	} satisfies StyleRule;
}

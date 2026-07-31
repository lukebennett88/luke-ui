import type { StyleRule } from '@vanilla-extract/css';
import { iconMaskUrls } from '../../.generated/icon-mask-data.js';
import { vars } from '../theme/contract.css.js';

/**
 * The `exclamationCircle` icon rendered as a CSS mask, at `size`. Factored out so
 * `invalidIndicatorIcon` (in-control) and `invalidMessageIcon` (message-leading)
 * share one mask definition instead of duplicating the mask URL and sizing.
 *
 * A mask, not an `<Icon>` element: each usage stays a pseudo-element driven entirely
 * by its recipe's invalid selector, so it can never drift out of sync with the
 * border or state it decorates. `content: '""'` is empty, which removes the
 * accessible-name concern entirely — there is no glyph for a wrapping `<label>`
 * (`Checkbox`) to read as its own text, so unlike the old text-glyph badge this
 * needs no alt-text trick.
 */
function invalidIconMask(size: string) {
	return {
		backgroundColor: vars.color.foreground.danger.rest,
		blockSize: size,
		content: '""',
		flexShrink: 0,
		inlineSize: size,
		maskImage: iconMaskUrls.exclamationCircle,
		maskPosition: 'center',
		maskRepeat: 'no-repeat',
		maskSize: 'contain',
		// No explicit `StyleRule` return-type annotation: that would widen every
		// caller's spread of this shape to the full `StyleRule` interface, which
		// blows the `.d.ts` isolated-declarations check once it is nested inside an
		// exported recipe config (`comboboxConfig`, `checkboxConfig`). `satisfies`
		// still validates the shape without widening the inferred literal type.
	} satisfies StyleRule;
}

/**
 * In-control invalid icon for `TextInput` and `Combobox`: a trailing `::after` inside
 * the control, gated on the invalid selector alone (not on whether a message exists),
 * for example `selectors: { [`${invalid}::after`]: invalidIndicatorIcon(size) }`.
 *
 * Takes `size` rather than a fixed constant: both consuming recipes have `small`/
 * `medium` control-size variants, and the icon must match its variant's own scale —
 * `combobox.css.ts` mirrors `COMBOBOX_ICON_SIZE` (`sizing/combobox-sizing.ts`) so the
 * error icon lands on the same size as the trigger/clear chevrons it sits beside;
 * `text-input.css.ts` has no internal icon to match but follows the same mapping for
 * consistency between the two field controls.
 *
 * This is the only non-colour cue an invalid control carries when `errorMessage` is
 * omitted (it is optional on `composeField`), so the icon alone must stay perceivable
 * without relying on the gated border colour beside it.
 */
export function invalidIndicatorIcon(size: string) {
	return {
		...invalidIconMask(size),
		marginInlineStart: vars.space[100],
	} satisfies StyleRule;
}

/**
 * Forced-colours override shared by `invalidIndicatorIcon` and `invalidMessageIcon`.
 * Merge into the consuming recipe's own `(forced-colors: active)` block, alongside
 * its other state overrides, rather than nesting a second `@media` block:
 * `CanvasText` (not the gated danger token) keeps the icon a solid, high-contrast
 * shape when author colours are ignored.
 *
 * `forcedColorAdjust` is not set here: that hack existed for the old text-glyph
 * badge, whose backplate Chromium's forced-colours mode re-painted underneath the
 * "!" character. A `mask-image` has no text run for the browser to re-paint, so the
 * ambient `forcedColorAdjust: 'auto'` the surrounding recipes already set at the slot
 * level is enough — only the fill colour needs overriding here.
 */
export const invalidIndicatorIconForcedColors = {
	backgroundColor: 'CanvasText',
} satisfies StyleRule;

/**
 * Gap between `invalidMessageIcon` and the message text that follows it, and also
 * the amount peeled off the leading end of `indent` before centring the icon (see
 * `invalidMessageIcon`) — for `Checkbox`, `indent` (`fieldMessageIndent`) is itself
 * `checkboxControlSize + this same space[200] token` (`checkbox.css.ts`), so
 * subtracting it back out recovers the control column's own width for the icon to
 * centre against, leaving this gap as the trailing space before text.
 */
const invalidMessageIconGap = vars.space[200];

/**
 * Leading icon for the shared `Field` error message (`field.css.ts`'s `message`
 * slot), switched on there by the `fieldMessageIcon` var. Checkbox is the only
 * recipe that turns it on: unlike `TextInput`/`Combobox`, its own box has no room
 * for an in-control icon without floating past the label — the specific thing an
 * earlier design pass on #247 was rejected for — so its icon moves to the message
 * instead. Fixed at `xsmall`, not sized per `size` variant like
 * `invalidIndicatorIcon`: the message text sits at a constant `font[200]` regardless
 * of the checkbox control's own size, so the icon beside it stays constant too.
 *
 * `display: inline-block` (set by `field.css.ts`, not here — see `fieldMessageIcon`),
 * not `flex`: `errorMessage` is typed `ReactNode` and RAC's `FieldError` also accepts
 * a render-prop child, so the message can contain arbitrary elements the recipe
 * cannot safely wrap in a span of its own. A `flex` message container turns every
 * top-level child into its own flex item — each wrapping independently instead of as
 * one paragraph — the moment the message is anything richer than a single text node.
 * An inline-block `::before` participates in the message's own normal text flow
 * instead, so rich content behaves exactly as it would with no icon at all.
 *
 * Takes `indent` — `field.css.ts`'s own `fieldMessageIndent` (with its `0px`
 * fallback already applied) — rather than a fixed size: the box's total inline
 * advance (its own `inlineSize` plus `marginInlineEnd`) must equal `indent` exactly,
 * so the text that resumes after the icon lands back at the label's left edge.
 * `inlineSize` itself is `indent` minus the trailing `invalidMessageIconGap` (see
 * there): for `Checkbox`, that recovers the control column's own width, so a
 * centred icon lines up with the control above it instead of centring across the
 * control-plus-gap span and drifting half the gap's width to the right of it.
 * `marginInlineEnd` supplies that trailing gap back. `maskSize` is set explicitly
 * to the icon's own `xsmall` size (not `contain`, which `invalidIconMask` defaults
 * to) so the 16px glyph centres inside the wider box instead of stretching to fill
 * it — `maskSize: 'contain'` would scale the icon up to the box, not stay the
 * checkbox's own icon size. `max()` guards the case where a consumer switches the
 * icon on without also setting `fieldMessageIndent`: `indent` would then fall back
 * to `0px`, and `indent - gap` would go negative and collapse the box (and the icon
 * inside it) to nothing, so the floor is the icon's own size alone.
 *
 * `textIndent: 0` resets the negative indent `field.css.ts` applies to the message
 * itself so it does not also shift this icon. `verticalAlign` is tuned by eye
 * against the message's first line, not derived from a token — icon masks do not
 * share text's baseline metrics.
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

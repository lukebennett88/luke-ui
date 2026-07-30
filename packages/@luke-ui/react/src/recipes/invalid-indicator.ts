import type { StyleRule } from '@vanilla-extract/css';
import { vars } from '../theme/contract.css.js';

/**
 * Shared `::after` badge that gives an invalid control a non-colour cue: a filled
 * circle containing "!". Field recipes (`text-input.css.ts`, `combobox.css.ts`,
 * `checkbox.css.ts`) apply it under their own invalid selector, for example
 * `selectors: { [`${invalid}::after`]: invalidIndicatorBadge }`.
 *
 * The `/ ""` in `content` is the CSS alt-text syntax. It keeps the glyph out of the
 * accessible name — load-bearing for `Checkbox`, whose badge sits inside
 * `CheckboxContent`, a native `<label>` wrapping the hidden input that otherwise
 * takes its accessible name from its contents.
 *
 * This is the only non-colour cue an invalid control carries when `errorMessage` is
 * omitted (it is optional on `composeField`), so the badge alone must stay
 * perceivable without relying on the gated border colour beside it.
 */
export const invalidIndicatorBadge = {
	alignItems: 'center',
	backgroundColor: vars.color.background.danger.solid.rest,
	blockSize: vars.iconSize.small,
	borderRadius: vars.radius.full,
	color: vars.color.foreground.danger.onSolid,
	content: '"!" / ""',
	display: 'inline-flex',
	flexShrink: 0,
	fontSize: vars.font[100].fontSize,
	fontWeight: vars.font.weight.heading,
	inlineSize: vars.iconSize.small,
	justifyContent: 'center',
	lineHeight: 1,
	marginInlineStart: vars.space[200],
} satisfies StyleRule;

/**
 * Forced-colours override for `invalidIndicatorBadge`. Merge into the consuming
 * recipe's own `(forced-colors: active)` block, alongside its other state
 * overrides, rather than nesting a second `@media` block: system colours (not the
 * gated danger tokens) keep the badge a solid, high-contrast shape when author
 * colours are ignored.
 *
 * `forcedColorAdjust: 'none'` opts this pseudo-element back out of the browser's
 * own forced-colours adjustment (the ambient `forcedColorAdjust: 'auto'` the
 * surrounding recipes set at the slot level). Without it, Chromium still inserts
 * its own text backplate behind the "!" glyph on top of our explicit
 * `CanvasText`/`Canvas` fill, splitting the circle into a black half and a white
 * half instead of a solid badge with a legible glyph. `loading-skeleton.css.ts`
 * establishes the same "opt back out to keep an authored solid fill" precedent.
 */
export const invalidIndicatorBadgeForcedColors = {
	backgroundColor: 'CanvasText',
	color: 'Canvas',
	forcedColorAdjust: 'none',
} satisfies StyleRule;

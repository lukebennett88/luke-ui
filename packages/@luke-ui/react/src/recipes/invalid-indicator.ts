import type { StyleRule } from '@vanilla-extract/css';
import { iconMaskUrls } from '../../.generated/icon-mask-data.js';
import { vars } from '../theme/contract.css.js';

/**
 * Shared `::after` icon that gives an invalid control a non-colour cue: the
 * `exclamationCircle` icon rendered as a CSS mask. Field recipes
 * (`text-input.css.ts`, `combobox.css.ts`, `checkbox.css.ts`) apply it under
 * their own invalid selector, for example
 * `selectors: { [`${invalid}::after`]: invalidIndicatorIcon }`.
 *
 * A mask, not an `<Icon>` element: the indicator is driven entirely by the
 * recipes' invalid selectors, so keeping it a pseudo-element means it can
 * never drift out of sync with the border it sits beside. `content: '""'` is
 * empty, which removes the accessible-name concern entirely — there is no
 * glyph for a wrapping `<label>` (`Checkbox`) to read as its own text, so
 * unlike the old text-glyph badge this needs no alt-text trick.
 *
 * This is the only non-colour cue an invalid control carries when `errorMessage` is
 * omitted (it is optional on `composeField`), so the icon alone must stay
 * perceivable without relying on the gated border colour beside it.
 */
export const invalidIndicatorIcon = {
	backgroundColor: vars.color.foreground.danger.rest,
	blockSize: vars.iconSize.small,
	content: '""',
	flexShrink: 0,
	inlineSize: vars.iconSize.small,
	marginInlineStart: vars.space[100],
	maskImage: iconMaskUrls.exclamationCircle,
	maskPosition: 'center',
	maskRepeat: 'no-repeat',
	maskSize: 'contain',
} satisfies StyleRule;

/**
 * Forced-colours override for `invalidIndicatorIcon`. Merge into the consuming
 * recipe's own `(forced-colors: active)` block, alongside its other state
 * overrides, rather than nesting a second `@media` block: `CanvasText` (not the
 * gated danger token) keeps the icon a solid, high-contrast shape when author
 * colours are ignored.
 *
 * `forcedColorAdjust` is not set here: that hack existed for the old text-glyph
 * badge, whose backplate Chromium's forced-colours mode re-painted underneath
 * the "!" character. A `mask-image` has no text run for the browser to
 * re-paint, so the ambient `forcedColorAdjust: 'auto'` the surrounding recipes
 * already set at the slot level is enough — only the fill colour needs
 * overriding here.
 */
export const invalidIndicatorIconForcedColors = {
	backgroundColor: 'CanvasText',
} satisfies StyleRule;

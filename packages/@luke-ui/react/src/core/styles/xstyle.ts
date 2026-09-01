import type { StyleXStyles } from '@stylexjs/stylex';
import * as stylex from '@stylexjs/stylex';
import { cx } from '../../shared/utils/utils.js';

/**
 * The type StyleX-migrated components use for their `xstyle` prop: an escape hatch that accepts
 * one or more compiled `stylex.create(...)` style objects (as `stylex.props` itself accepts —
 * `false`, `null`, and `undefined` included, so a caller's conditional expression composes
 * directly), authored against a component's own CSS property surface `CSS`.
 */
export type XStyleProp<CSS extends Record<string, unknown> = Record<string, unknown>> =
	StyleXStyles<CSS>;

/**
 * Merges a component's resolved recipe class, its `xstyle` escape hatch, and the consumer's own
 * `className` into one class string, in the precedence StyleX-migrated components apply:
 *
 *   1. internal defaults and 2. component variants — already folded into `recipeClass` by the
 *      component's own `recipe()` call, before this function ever sees it
 *   3. `xstyle` — folded through `stylex.props` here, so it participates in StyleX's cascade
 *      layering (see #550/#536) the same way the recipe's own classes do
 *   4. `className` — appended last, so an unlayered consumer class beats every layered Luke UI
 *      atom by cascade-layer precedence, regardless of the source-order position this function
 *      places it in
 *
 * `style` is never touched here — pass it through to the element untouched, unmerged with
 * anything StyleX resolves, matching `recipe()`'s own string-only contract.
 */
export function resolveXStyleClassName(
	recipeClass: string,
	xstyle: XStyleProp | undefined,
	className: string | undefined,
): string {
	const xstyleClassName = xstyle === undefined ? undefined : stylex.props(xstyle).className;
	return cx(recipeClass, xstyleClassName, className);
}

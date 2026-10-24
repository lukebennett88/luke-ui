/**
 * SPIKE #925. Names the private variables behind overlay-anchored subtle fills.
 *
 * The theme writes two private sets of the 18 subtle colours in every mode rule: `base`, tuned
 * against `surface.base`, and `overlay`, the same fills lifted by the overlay's lightness offset.
 * Each public subtle token is declared as `var(<anchor>, <base value>)`. The surface pairing sets the
 * anchor on a surface element, so on an element that also carries `data-color-mode`, where the
 * unlayered theme rule redeclares the public token, the theme's own declaration resolves through the
 * anchor that the layered pairing set.
 *
 * Imports nothing but types, so `core/styles/surface.ts` can use it without theme generation.
 */

/** A subtle-fill anchor set. */
export type SubtleAnchorSet = 'anchor' | 'base' | 'overlay';

/** For example `--luke-internal-subtle-overlay-accent-hover`. */
export function subtleAnchorVarName(set: SubtleAnchorSet, role: string, state: string): string {
	return `--luke-internal-subtle-${set}-${role}-${state}`;
}

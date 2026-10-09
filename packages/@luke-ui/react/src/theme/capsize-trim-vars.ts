/**
 * Names the private Capsize trim variables. The theme stylesheet writes them in its identity rule,
 * because they depend on the theme's font, and `Text` reads them. They are implementation metrics,
 * not design roles, so they are not part of the public `vars` contract.
 *
 * This module must keep importing nothing but types, so the `Text` recipe can use it without pulling
 * in theme generation.
 */

import type { TypeStyle } from './type-styles.js';

/** The two Capsize trims each type style carries. */
export type CapsizeTrim = 'baselineTrim' | 'capHeightTrim';

const TRIM_SEGMENT = {
	baselineTrim: 'baseline-trim',
	capHeightTrim: 'cap-height-trim',
} as const satisfies Record<CapsizeTrim, string>;

/**
 * Returns the private custom property name for one type style's trim, for example
 * `--luke-internal-font-body-baseline-trim`.
 */
export function capsizeTrimVarName(style: TypeStyle, trim: CapsizeTrim): string {
	return `--luke-internal-font-${style}-${TRIM_SEGMENT[trim]}`;
}

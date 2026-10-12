import { capsizeTrimVarName } from '../../theme/capsize-trim-vars.js';
import { vars } from '../../theme/contract.css.js';
import type { TypeStyle } from '../../theme/type-styles.js';

/**
 * The font declarations a type style sets. `Text` and `Prose` both build their rules from this, so
 * a style means the same thing in each. A plain module so `.css.ts` files can import it.
 */
export function typeStyleFontDeclarations(typography: TypeStyle) {
	const font = vars.font[typography];
	return {
		fontFamily: font.fontFamily,
		fontSize: font.fontSize,
		letterSpacing: font.letterSpacing,
		lineHeight: font.lineHeight,
	};
}

/**
 * References to a type style's private Capsize trims. The theme stylesheet writes them, because
 * they depend on the theme's font.
 */
export function typeStyleTrimVars(typography: TypeStyle) {
	return {
		baselineTrim: `var(${capsizeTrimVarName(typography, 'baselineTrim')})`,
		capHeightTrim: `var(${capsizeTrimVarName(typography, 'capHeightTrim')})`,
	};
}

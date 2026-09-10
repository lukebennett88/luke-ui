import { vars } from '../../theme/contract.css.js';
import { globalStyleInLayer, style } from '../styles/layered-style.css.js';

/** Centers the icon graphic inside an icon-only control. */
export const iconOnlyIconWrapper = style({
	alignItems: 'center',
	display: 'inline-flex',
	justifyContent: 'center',
});

/**
 * Sizes a direct `svg` child to the button icon size. `IconSizeProvider` covers a
 * `createIcon`-based custom icon, but a plain `<svg>` reads no context, so this rule constrains the
 * graphic box directly for a hand-authored custom icon such as a brand mark.
 */
globalStyleInLayer('structural', `${iconOnlyIconWrapper} > svg`, {
	blockSize: vars.iconSize.xsmall,
	inlineSize: vars.iconSize.xsmall,
});

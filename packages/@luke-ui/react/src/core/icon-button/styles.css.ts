import { contextualIconSize } from '../icon/icon-sizing.js';
import { globalStyleInLayer, style } from '../styles/layered-style.css.js';

/** Centers the icon graphic inside an icon-only control. */
export const iconOnlyIconWrapper = style({
	alignItems: 'center',
	display: 'inline-flex',
	justifyContent: 'center',
});

/**
 * Sizes a direct `svg` child, such as a brand mark, to the icon size the button sets, so a custom
 * icon needs no sizing of its own.
 */
globalStyleInLayer('recipes', `:where(${iconOnlyIconWrapper} > svg)`, {
	blockSize: contextualIconSize,
	inlineSize: contextualIconSize,
});

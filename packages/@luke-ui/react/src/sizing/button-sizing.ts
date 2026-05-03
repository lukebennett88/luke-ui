import type { FontSizeToken, IconSizeToken } from '../tokens/index.js';

/** Maps button size to the appropriate icon/spinner size. */
export const BUTTON_ICON_SIZE: Record<'medium' | 'small', IconSizeToken> = {
	medium: 'medium',
	small: 'xsmall',
};

/** Maps button size to the appropriate Text fontSize for composed button label. */
export const BUTTON_FONT_SIZE: Record<'medium' | 'small', FontSizeToken> = {
	medium: 'standard',
	small: 'small',
};

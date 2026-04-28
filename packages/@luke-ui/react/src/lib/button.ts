import type { FontSizeToken, IconSizeToken } from '../tokens/index.js';

/** Button size → icon/spinner size so icons align with control size. */
export const BUTTON_ICON_SIZE = {
	medium: 'medium',
	small: 'xsmall',
} as const satisfies Record<'medium' | 'small', IconSizeToken>;

/** Button size → Text fontSize for composed button label. */
export const BUTTON_FONT_SIZE = {
	medium: 'standard',
	small: 'small',
} as const satisfies Record<'medium' | 'small', FontSizeToken>;

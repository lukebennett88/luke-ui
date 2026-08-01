import type { IconSize } from '../types/icon-size.js';
import type { FieldControlSize } from './control-size.js';

/** Maps combobox control size to the appropriate icon size. */
export const COMBOBOX_ICON_SIZE: Record<FieldControlSize, IconSize> = {
	medium: 'small',
	small: 'xsmall',
};

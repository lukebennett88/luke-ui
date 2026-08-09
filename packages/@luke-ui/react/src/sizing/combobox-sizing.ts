import type { IconSize } from '../types/icon-size.js';
import type { FieldControlSize } from './control-size.js';

/** Maps combobox control size to the appropriate icon size. */
export const COMBOBOX_ICON_SIZE: Record<FieldControlSize, IconSize> = {
	medium: 'small',
	small: 'xsmall',
};

/**
 * Size of the selected-item check icon. The check sits beside option text
 * rather than scaling with the control, so it stays fixed at both combobox
 * sizes instead of following `COMBOBOX_ICON_SIZE`.
 */
export const COMBOBOX_CHECK_ICON_SIZE: IconSize = 'xsmall';

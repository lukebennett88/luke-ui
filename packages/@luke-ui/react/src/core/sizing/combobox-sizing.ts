import type { IconSize } from '../types/icon-size.js';

/**
 * Size of the check icon on a selected Combobox item. Always 16px, even when the surrounding
 * control is larger — intentional exception that keeps the glyph from following
 * `FIELD_CONTROL_ICON_SIZE`.
 */
export const COMBOBOX_CHECK_ICON_SIZE: IconSize = 'px16';

/** Square size of the medium Combobox trigger and clear button: 28px, and never below 24px. */
export const COMBOBOX_ACTION_SIZE = 'max(1.75rem, 24px)';

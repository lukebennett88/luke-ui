import type { IconSize } from '../types/icon-size.js';

/**
 * Maps combobox control size to the appropriate icon size.
 *
 * The key union stays hard-coded here rather than derived from `ComboboxSize`
 * (`recipes/combobox.css.ts`): that recipe's config consumes this constant, so
 * importing its inferred type back here creates a circular type reference.
 */
export const COMBOBOX_ICON_SIZE: Record<'medium' | 'small', IconSize> = {
	medium: 'small',
	small: 'xsmall',
};

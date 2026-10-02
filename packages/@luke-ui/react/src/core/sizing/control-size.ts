import type { IconSize } from '../types/icon-size.js';

/**
 * Size union shared by the field controls (`Combobox`, `TextInput`).
 *
 * Named apart from the `vars.controlSize` theme token — that's the physical block-size
 * value shared by every sized control (buttons included); this is a type, scoped to the
 * two field controls, so the two aren't mistaken for each other.
 *
 * This module is a leaf: it must never import recipe modules. `ComboboxSize`
 * (`primitives/combobox/styles.css.ts`) and `TextInputSize` (`primitives/text-input/recipe.css.ts`)
 * derive from their recipe configs and must stay equal to this union.
 */
export type FieldControlSize = 'medium' | 'small';

/** Maps field control size to the icon size those controls provide. */
export const FIELD_CONTROL_ICON_SIZE: Record<FieldControlSize, IconSize> = {
	medium: 'small',
	small: 'xsmall',
};

import type { IconSize } from '../types/icon-size.js';

/**
 * Size union shared by the field controls (`Combobox`, `InputGroup`).
 *
 * Named apart from the `vars.controlSize` theme token — that's the physical block-size
 * value shared by every sized control (buttons included); this is a type, scoped to the
 * two field controls, so the two aren't mistaken for each other.
 *
 * This module is a leaf: it must never import recipe modules. Both `ComboboxSize`
 * (`primitives/combobox/recipe.ts`) and `InputGroupSize` (`primitives/input-group/recipe.ts`)
 * derived from their recipe configs — each recipe file asserts its derived type is
 * exactly this union so the two can never drift apart.
 */
export type FieldControlSize = 'medium' | 'small';

/** Maps field control size to the icon size those controls provide. */
export const FIELD_CONTROL_ICON_SIZE: Record<FieldControlSize, IconSize> = {
	medium: 'small',
	small: 'xsmall',
};

/**
 * Size union shared by the field controls (`Combobox`, `InputGroup`) whose icon-size
 * maps (`COMBOBOX_ICON_SIZE`, `INPUT_GROUP_ICON_SIZE`) are keyed by it.
 *
 * Named apart from the `vars.controlSize` theme token — that's the physical block-size
 * value shared by every sized control (buttons included); this is a type, scoped to the
 * two field controls, so the two aren't mistaken for each other.
 *
 * This module is a leaf: it must never import from `../recipes/`. Both `ComboboxSize`
 * (`recipes/combobox.css.ts`) and `InputGroupSize` (`recipes/input-group.css.ts`) stay
 * derived from their recipe configs — each recipe file asserts its derived type is
 * exactly this union so the two can never drift apart.
 */
export type FieldControlSize = 'medium' | 'small';

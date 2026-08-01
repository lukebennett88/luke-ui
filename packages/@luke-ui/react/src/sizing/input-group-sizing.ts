import type { IconSize } from '../types/icon-size.js';
import type { FieldControlSize } from './control-size.js';

/**
 * Maps `InputGroup` control size to the icon size it provides through
 * `IconSizeProvider` — its own invalid indicator and any icon a caller puts in a
 * prefix or suffix. Mirrors `COMBOBOX_ICON_SIZE` (`sizing/combobox-sizing.ts`) so the
 * two field controls scale their icons the same way.
 */
export const INPUT_GROUP_ICON_SIZE: Record<FieldControlSize, IconSize> = {
	medium: 'small',
	small: 'xsmall',
};

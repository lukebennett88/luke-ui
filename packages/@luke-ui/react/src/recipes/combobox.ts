import type { ComboboxVariantProps } from '../../styled-system/recipes/combobox.mjs';
import type { PlainVariants } from '../types/plain-variants.js';
export {
	comboboxTrayKeyboardInsetVar,
	comboboxTrayViewportHeightVar,
} from './combobox-viewport-vars.js';

export type ComboboxVariants = PlainVariants<ComboboxVariantProps>;
export { combobox } from '../../styled-system/recipes/combobox.mjs';

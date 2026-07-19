import type { ComboboxVariantProps } from '../../styled-system/recipes/combobox.mjs';
import { combobox } from '../../styled-system/recipes/combobox.mjs';
import type { PlainVariants } from '../types/plain-variants.js';

/** Custom property mirroring `visualViewport.height`, set by `useVisualViewportVars`. */
export const comboboxTrayViewportHeightVar = '--luke-ui-visual-viewport-height';

/** Custom property mirroring the on-screen keyboard's height, set by `useVisualViewportVars`. */
export const comboboxTrayKeyboardInsetVar = '--luke-ui-keyboard-inset';

export type ComboboxVariants = PlainVariants<ComboboxVariantProps>;

export const comboboxRoot = combobox().root;
export const comboboxItemCheck = combobox().itemCheck;
export const comboboxSectionHeading = combobox().sectionHeading;

export function comboboxControl(variants: ComboboxVariants = {}): string {
	return combobox(variants).control;
}

export function comboboxTextInput(variants: ComboboxVariants = {}): string {
	return combobox(variants).textInput;
}

export function comboboxTrigger(variants: ComboboxVariants = {}): string {
	return combobox(variants).trigger;
}

export function comboboxClearButton(variants: ComboboxVariants = {}): string {
	return combobox(variants).clearButton;
}

export function comboboxPopover(variants: ComboboxVariants = {}): string {
	return combobox(variants).popover;
}

export function comboboxListBox(variants: ComboboxVariants = {}): string {
	return combobox(variants).listBox;
}

export function comboboxLoadMoreItem(variants: ComboboxVariants = {}): string {
	return combobox(variants).loadMoreItem;
}

export function comboboxSection(variants: ComboboxVariants = {}): string {
	return combobox(variants).section;
}

export function comboboxEmptyState(variants: ComboboxVariants = {}): string {
	return combobox(variants).emptyState;
}

export function comboboxItem(variants: ComboboxVariants = {}): string {
	return combobox(variants).item;
}

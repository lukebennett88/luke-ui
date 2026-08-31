import { styleInLayer } from '../../styles/layered-style.css.js';

/**
 * Marker class for combobox section structural selectors. The adjacent-sibling border lives in
 * `core/styles/structural.css.ts` so it can target `+` without living in the recipe layer.
 */
export const comboboxSectionScopeClassName = styleInLayer('recipes', {}, 'combobox-section');

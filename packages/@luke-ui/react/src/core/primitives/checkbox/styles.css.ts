import { style } from '../../styles/layered-style.css.js';

/**
 * Marker class on every `CheckboxContent`. `checkboxRecipe` targets the last label element inside
 * it, which a recipe slot cannot select, to draw the necessity marker after the last word.
 */
export const checkboxContentScopeClassName = style({}, 'checkbox-content');

import { style } from '../../styles/layered-style.css.js';

/**
 * Marker class on every `TextInputControl`. `textInputRecipe`'s `root` slot probes for it to decide
 * whether the in-control invalid icon or the error-message icon carries the field's invalid cue.
 */
export const textInputControlScopeClassName = style({}, 'text-input-control');

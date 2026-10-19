import { style } from '../styles/layered-style.css.js';
import { recipe } from '../styles/recipe.js';
import { kbdAppearance } from './appearance.js';

export const kbdElementClassName = style({}, 'kbd');

/** Key chip for `<kbd>`. Scales with surrounding text and sets its own spacing. */
export const kbdRecipe = recipe({
	base: [kbdElementClassName, kbdAppearance],
});

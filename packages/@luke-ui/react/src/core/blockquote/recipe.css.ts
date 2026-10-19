import { style } from '../styles/layered-style.css.js';
import { recipe } from '../styles/recipe.js';
import { blockquoteAppearance } from './appearance.js';

export const blockquoteElementClassName = style({}, 'blockquote');

/** Left-border accent. Type treatment comes from the composed `Text`. */
export const blockquoteRecipe = recipe({
	base: [blockquoteElementClassName, blockquoteAppearance],
});

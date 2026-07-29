import { styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';
import type { RecipeSelection } from './recipe.js';
import { recipe } from './recipe.js';

const base = styleInLayer('recipes', {
	borderInlineStart: `3px solid ${vars.color.border.decorative}`,
	paddingInlineStart: vars.space[400],
});

/** Vanilla-extract recipe for the `Blockquote` component's left-border accent. */
export const blockquote = recipe({
	base,
});

export type BlockquoteVariants = RecipeSelection<typeof blockquote>;

import { styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';
import type { RecipeSelection } from './recipe.js';
import { recipe } from './recipe.js';

const base = styleInLayer('recipes', {
	backgroundColor: vars.color.surface.recessed,
	borderRadius: vars.radius.control,
	color: vars.color.text.primary,
	fontFamily: vars.font.family.code,
	fontSize: '0.8125em',
	lineHeight: 1,
	paddingBlock: '0.15em',
	paddingInline: '0.3em',
	whiteSpace: 'nowrap',
});

/** Vanilla-extract recipe for the `Code` component's inline code appearance. */
export const code = recipe({
	base,
});

export type CodeVariants = RecipeSelection<typeof code>;

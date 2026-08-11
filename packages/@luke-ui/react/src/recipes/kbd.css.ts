import { styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';
import type { RecipeSelection } from './recipe.js';
import { recipe } from './recipe.js';

const base = styleInLayer('recipes', {
	alignItems: 'center',
	backgroundColor: vars.color.surface.recessed,
	borderColor: vars.color.border.decorative,
	borderRadius: vars.radius.control,
	borderStyle: 'solid',
	borderWidth: '1px',
	color: vars.color.text.primary,
	display: 'inline-flex',
	fontFamily: vars.font.family.code,
	fontSize: vars.font.caption.fontSize,
	fontWeight: vars.font.weight.body,
	inlineSize: 'fit-content',
	lineHeight: 1,
	paddingBlock: '0.1em',
	paddingInline: '0.35em',
	whiteSpace: 'nowrap',
});

/** Vanilla-extract recipe for the `Kbd` component's inline keyboard-key appearance. */
export const kbd = recipe({
	base,
});

export type KbdVariants = RecipeSelection<typeof kbd>;

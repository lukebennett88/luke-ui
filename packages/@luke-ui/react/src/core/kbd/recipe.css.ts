import { vars } from '../../theme/contract.css.js';
import type { RecipeSelection } from '../styles/recipe-types.js';
import { recipe } from '../styles/recipe.js';

/** Key chip for `<kbd>`. Scales with surrounding text and sets its own spacing. */
export const kbdRecipe = recipe({
	base: {
		alignItems: 'center',
		backgroundColor: vars.color.surface.recessed,
		blockSize: 'fit-content',
		borderColor: vars.color.border.decorative,
		borderRadius: vars.radius.control,
		borderStyle: 'solid',
		borderWidth: '1px',
		color: vars.color.text.primary,
		display: 'inline-flex',
		flexShrink: 0,
		fontFamily: vars.font.family.body,
		fontSize: '0.75em',
		fontWeight: vars.font.weight.body,
		inlineSize: 'fit-content',
		justifyContent: 'center',
		letterSpacing: '0.035em',
		lineHeight: 1.4,
		minInlineSize: '1.75em',
		paddingBlock: '0.1em',
		paddingInline: '0.35em',
		verticalAlign: 'middle',
		whiteSpace: 'nowrap',
		wordSpacing: '0.08em',
	},
});

export type KbdRecipeVariants = RecipeSelection<typeof kbdRecipe>;

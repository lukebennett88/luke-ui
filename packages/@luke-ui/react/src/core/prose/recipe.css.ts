import { globalStyleInLayer, styleInLayer } from '../styles/layered-style.css.js';
import type { RecipeSelection } from '../styles/recipe.js';
import { recipe } from '../styles/recipe.js';
import { vars } from '../../theme/contract.css.js';

const base = styleInLayer('recipes', {}, 'prose');

/** Vanilla-extract recipe for a fixed long-form document rhythm. */
export const proseRecipe = recipe({ base });

export type ProseRecipeVariants = RecipeSelection<typeof proseRecipe>;

// Wrapping the root and matched element keeps every rule at 0-0-0.
function proseStyle(selector: string, rule: Parameters<typeof globalStyleInLayer>[2]) {
	globalStyleInLayer('recipes', `:where(.${base}) :where(${selector})`, rule);
}

// Each gap is the following block's start margin. No block-end margin can collapse or escape.
proseStyle(
	'p, h1, h2, h3, h4, h5, h6, ul, ol, li, dl, dt, dd, blockquote, pre, hr, figure, figcaption, table, img, picture, video',
	{ marginBlock: 0 },
);
proseStyle('* + p, * + ul, * + ol, * + dl, * + h1', { marginBlockStart: vars.space.sp24 });
proseStyle('* + h2, * + hr', { marginBlockStart: vars.space.sp48 });
proseStyle('* + h3, * + blockquote, * + table, * + figure, * + img, * + picture, * + video', {
	marginBlockStart: vars.space.sp32,
});
proseStyle('* + h4, * + h5, * + h6, * + pre', { marginBlockStart: vars.space.sp24 });
proseStyle('* + li, * + dd', { marginBlockStart: vars.space.sp8 });
proseStyle('* + dt', { marginBlockStart: vars.space.sp24 });
proseStyle('* + figcaption, li > ul, li > ol, li > p + p', {
	marginBlockStart: vars.space.sp12,
});

// Tailwind Typography resets the next block after headings; h1 has its own 32px bottom margin.
proseStyle('h1 + *', { marginBlockStart: vars.space.sp32 });
proseStyle('h1 + h2, h1 + hr', { marginBlockStart: vars.space.sp48 });
proseStyle('h2 + *', { marginBlockStart: vars.space.sp24 });
proseStyle('h3 + *', { marginBlockStart: vars.space.sp12 });
proseStyle('h4 + *, h5 + *, h6 + *', { marginBlockStart: vars.space.sp8 });
proseStyle('hr + *', { marginBlockStart: vars.space.sp48 });

proseStyle('picture', { display: 'block' });
proseStyle('figure > img, figure > picture, figure > video, picture > img', {
	marginBlockStart: 0,
});

proseStyle('ul', { listStyle: 'disc', paddingInlineStart: vars.space.sp24 });
proseStyle('ol', { paddingInlineStart: vars.space.sp24 });
proseStyle('ol:not([type])', { listStyleType: 'decimal' });
proseStyle('ul ul', { listStyleType: 'circle' });
proseStyle('ul ul ul', { listStyleType: 'square' });
proseStyle('ol ol:not([type])', { listStyleType: 'lower-alpha' });
proseStyle('ol ol ol:not([type])', { listStyleType: 'lower-roman' });

// A rule is a section break; table cells need padding after the reset removes it.
proseStyle('hr', {
	blockSize: 0,
	border: 'none',
	borderBlockStart: `1px solid ${vars.color.border.decorative}`,
});
proseStyle('th, td', { paddingBlock: vars.space.sp8, paddingInline: vars.space.sp12 });
proseStyle('th', { textAlign: 'start' });
proseStyle('thead th', { borderBlockEnd: `1px solid ${vars.color.border.decorative}` });

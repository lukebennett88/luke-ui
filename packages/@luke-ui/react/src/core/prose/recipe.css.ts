import { vars } from '../../theme/contract.css.js';
import { globalStyleInLayer } from '../styles/layered-style.css.js';
import type { RecipeSelection } from '../styles/recipe.js';
import { recipe } from '../styles/recipe.js';
import { proseScopeClassName } from './scope.css.js';

/** Vanilla-extract recipe for a fixed long-form document rhythm. */
export const proseRecipe = recipe({ base: proseScopeClassName });

export type ProseRecipeVariants = RecipeSelection<typeof proseRecipe>;

// Wrapping the root and matched element keeps every rule at 0-0-0.
function proseStyle(selector: string, rule: Parameters<typeof globalStyleInLayer>[2]) {
	globalStyleInLayer('recipes', `:where(.${proseScopeClassName}) :where(${selector})`, rule);
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

proseStyle('h1 + *', { marginBlockStart: vars.space.sp32 });
proseStyle('h1 + h2, h1 + hr', { marginBlockStart: vars.space.sp48 });
proseStyle('h2 + *', { marginBlockStart: vars.space.sp24 });
proseStyle('h3 + *', { marginBlockStart: vars.space.sp12 });
proseStyle('h4 + *, h5 + *, h6 + *', { marginBlockStart: vars.space.sp8 });
// A rule is a section break on both sides.
proseStyle('hr + *', { marginBlockStart: vars.space.sp48 });

proseStyle('img, picture, video', { display: 'block' });
proseStyle('figure > img, figure > picture, figure > video, picture > img', {
	marginBlockStart: 0,
});

proseStyle('ul', { listStyleType: 'disc', paddingInlineStart: vars.space.sp24 });
// Untyped ols restore decimal. Typed ols omit list-style-type so HTML presentational hints apply
// inside Prose; the reset leaves those ols alone via `proseScopeClassName` from `./scope.css.js`.
proseStyle('ol:not([type])', { listStyleType: 'decimal', paddingInlineStart: vars.space.sp24 });
proseStyle('ol[type]', { paddingInlineStart: vars.space.sp24 });

proseStyle('hr', {
	blockSize: 0,
	border: 'none',
	borderBlockStart: `1px solid ${vars.color.border.decorative}`,
});
// Wide content scrolls inside its own box instead of clipping or widening the document. A scroll
// container cannot keep `overflow-y: visible`, so the box must fit its own content: an inline
// `Code` child adds block padding on top of the line box, which would clip its descenders here.
proseStyle('pre', { overflowX: 'auto', paddingBlock: vars.space.sp4 });
// `overflow` has no effect on `display: table`, which shrink-wraps to content; make it a block
// so the overflow rule applies and the table stays within the root's width.
proseStyle('table', { display: 'block', overflowX: 'auto' });
// Table cells need padding after the reset removes it.
proseStyle('th, td', { paddingBlock: vars.space.sp8, paddingInline: vars.space.sp12 });
proseStyle('th', { textAlign: 'start' });
proseStyle('thead th', { borderBlockEnd: `1px solid ${vars.color.border.decorative}` });

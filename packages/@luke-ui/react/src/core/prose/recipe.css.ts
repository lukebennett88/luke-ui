import { vars } from '../../theme/contract.css.js';
import { globalStyleInLayer, style } from '../styles/layered-style.css.js';
import { recipe } from '../styles/recipe.js';

/**
 * The Prose scope class. Every Prose rule below is scoped to it, and `proseRecipe()` applies it as
 * its base class, so `<Prose>` and recipe-only usage scope identically.
 */
const proseScopeClassName = style({}, 'prose');

/** Scope class for the long-form rhythm applied by the global rules below. */
export const proseRecipe = recipe({ base: proseScopeClassName });

// Every rule sits in an `@scope` from the Prose class to the `not-prose` class. The limit excludes
// a `not-prose` element and everything under it, and a nested Prose starts its own scope, so it
// applies again inside the boundary. `:where()` on the match and the implicit scope root add no
// specificity, so recipe and utility classes win on specificity as well as on layer order.
const proseScope = `(.${proseScopeClassName})`;

function proseStyle(selector: string, rule: Parameters<typeof globalStyleInLayer>[2]) {
	globalStyleInLayer('recipes', `:where(${selector})`, {
		'@scope': { [`${proseScope} to (.not-prose)`]: rule },
	});
}

// A `not-prose` element still sits in the surrounding flow, so it keeps the gap that follows a
// heading or rule. This scope stops below the boundary: `not-prose` descendants get nothing.
function proseBoundaryGapStyle(previous: ReadonlyArray<string>, gap: string) {
	const selector = previous.map((tag) => `${tag} + .not-prose`).join(', ');
	globalStyleInLayer('recipes', `:where(${selector})`, {
		'@scope': { [`${proseScope} to (.not-prose *)`]: { marginBlockStart: gap } },
	});
}

// Each gap is the following block's start margin. No block-end margin can collapse or escape.
// Inline margins go too: user agents indent blockquotes, figures, and `dd`.
proseStyle(
	'p, h1, h2, h3, h4, h5, h6, ul, ol, li, dl, dt, dd, blockquote, pre, hr, figure, figcaption, table, img, picture, video',
	{ margin: 0 },
);
proseStyle('* + p, * + ul, * + ol, * + dl, * + h1', { marginBlockStart: vars.space.sp32 });
proseStyle('* + h2, * + hr', { marginBlockStart: vars.space.sp64 });
proseStyle('* + h3, * + blockquote, * + table, * + figure, * + img, * + picture, * + video', {
	marginBlockStart: vars.space.sp40,
});
proseStyle('* + h4, * + h5, * + h6, * + pre', { marginBlockStart: vars.space.sp32 });
proseStyle('* + li, * + dd', { marginBlockStart: vars.space.sp12 });
proseStyle('* + dt', { marginBlockStart: vars.space.sp32 });
proseStyle('* + figcaption, li > ul, li > ol, li > p + p', {
	marginBlockStart: vars.space.sp16,
});

proseStyle('h1 + *', { marginBlockStart: vars.space.sp40 });
proseStyle('h1 + h2, h1 + hr', { marginBlockStart: vars.space.sp64 });
proseStyle('h2 + *', { marginBlockStart: vars.space.sp32 });
proseStyle('h3 + *', { marginBlockStart: vars.space.sp24 });
proseStyle('h4 + *, h5 + *, h6 + *', { marginBlockStart: vars.space.sp16 });
// A rule is a section break on both sides.
proseStyle('hr + *', { marginBlockStart: vars.space.sp64 });

proseStyle('img, picture, video', { display: 'block' });
proseStyle('figure > img, figure > picture, figure > video, picture > img', {
	marginBlockStart: 0,
});

// Markers are restated so a framework reset below Luke UI, such as Tailwind Preflight, cannot
// remove them. A typed `ol` keeps its HTML presentational hint, which any author `list-style-type`
// would override.
proseStyle('ul, ol', { paddingInlineStart: vars.space.sp24 });
proseStyle('ul', { listStyleType: 'disc' });
proseStyle('ol:not([type])', { listStyleType: 'decimal' });

proseStyle('hr', {
	blockSize: 0,
	border: 'none',
	borderBlockStart: `1px solid ${vars.color.border.decorative}`,
});
proseStyle('table', { borderCollapse: 'collapse', borderSpacing: 0 });
proseStyle('th, td', { paddingBlock: vars.space.sp8, paddingInline: vars.space.sp12 });
proseStyle('caption, th', { textAlign: 'start' });
proseStyle('thead th', { borderBlockEnd: `1px solid ${vars.color.border.decorative}` });

proseBoundaryGapStyle(['h1'], vars.space.sp40);
proseBoundaryGapStyle(['h2'], vars.space.sp32);
proseBoundaryGapStyle(['h3'], vars.space.sp24);
proseBoundaryGapStyle(['h4', 'h5', 'h6'], vars.space.sp16);
proseBoundaryGapStyle(['hr'], vars.space.sp64);

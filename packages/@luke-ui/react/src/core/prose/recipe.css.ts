import { vars } from '../../theme/contract.css.js';
import { globalStyleInLayer } from '../styles/layered-style.css.js';
import { recipe } from '../styles/recipe.js';
import { proseScopeClassName } from './scope.css.js';

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
proseStyle(
	'p, h1, h2, h3, h4, h5, h6, ul, ol, li, dl, dt, dd, blockquote, pre, hr, figure, figcaption, table, img, picture, video',
	{ marginBlock: 0 },
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
proseStyle('img, video', { blockSize: 'auto', maxInlineSize: '100%' });
proseStyle('picture', { maxInlineSize: '100%' });
proseStyle('figure > img, figure > picture, figure > video, picture > img', {
	marginBlockStart: 0,
});

proseStyle('pre', {
	maxInlineSize: '100%',
	minInlineSize: 0,
	overflowX: 'auto',
});
// Block code overrides the Text and Code font recipes while staying inside the Prose boundary.
globalStyleInLayer('recipes', ':scope pre', {
	'@scope': {
		[`${proseScope} to (.not-prose)`]: { fontFamily: vars.font.family.code },
	},
});
globalStyleInLayer('recipes', ':scope pre code', {
	'@scope': {
		[`${proseScope} to (.not-prose)`]: {
			backgroundColor: 'transparent',
			border: 0,
			borderRadius: 0,
			fontSize: 'inherit',
			padding: 0,
			whiteSpace: 'inherit',
		},
	},
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
proseStyle('table', { inlineSize: '100%' });
// Table cells need padding after the reset removes it.
proseStyle('th, td', { paddingBlock: vars.space.sp8, paddingInline: vars.space.sp12 });
proseStyle('th', { textAlign: 'start', verticalAlign: 'bottom' });
proseStyle('td', { verticalAlign: 'baseline' });
proseStyle('thead th', { borderBlockEnd: `1px solid ${vars.color.border.decorative}` });
proseStyle('tbody tr + tr, tfoot', {
	borderBlockStart: `1px solid ${vars.color.border.decorative}`,
});

proseBoundaryGapStyle(['h1'], vars.space.sp40);
proseBoundaryGapStyle(['h2'], vars.space.sp32);
proseBoundaryGapStyle(['h3'], vars.space.sp24);
proseBoundaryGapStyle(['h4', 'h5', 'h6'], vars.space.sp16);
proseBoundaryGapStyle(['hr'], vars.space.sp64);

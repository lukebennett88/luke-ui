import { globalStyleInLayer, styleInLayer } from '../styles/layered-style.css.js';
import type { RecipeSelection } from '../styles/recipe.js';
import { recipe } from '../styles/recipe.js';
import { vars } from '../../theme/contract.css.js';

// The base rule is empty on purpose. `Prose` sets nothing on its own box; the class exists
// so the descendant rules below have something to scope to, which `style()` cannot express.
const base = styleInLayer('recipes', {}, 'prose');

/**
 * Vanilla-extract recipe for the `Prose` component's block rhythm. One document rhythm
 * serves the whole library, so the recipe declares no variants.
 */
export const proseRecipe = recipe({
	base,
});

export type ProseRecipeVariants = RecipeSelection<typeof proseRecipe>;

const root = `.${base}`;

/**
 * Every selector is wrapped in `:where()` so each rule contributes zero specificity. A
 * consumer overrides any of it with a plain class on the element itself, which is the whole
 * point of a public prose component: markup it does not control still has to be adjustable.
 */
function proseStyle(selector: string, rule: Parameters<typeof globalStyleInLayer>[2]) {
	globalStyleInLayer('recipes', `${root} :where(${selector})`, rule);
}

// Spacing runs one direction: `margin-block-end` on the element that just ended, plus a
// `* + heading` rule for the larger gap a heading opens above itself. Nothing relies on
// margin collapse, because the trim pseudo-elements on `Text` and `Heading` are
// `display: table` and no margin collapses through a box edge.
proseStyle('p, ul, ol, blockquote, pre, figure, dl', { marginBlockEnd: vars.space.sp24 });
proseStyle('h1, h2', { marginBlockEnd: vars.space.sp16 });
proseStyle('h3, h4', { marginBlockEnd: vars.space.sp12 });
proseStyle('h5, h6, li, figcaption', { marginBlockEnd: vars.space.sp8 });
proseStyle('table', { marginBlockEnd: vars.space.sp32 });
proseStyle('dd', { marginBlockEnd: vars.space.sp16 });
proseStyle('dt', { marginBlockEnd: vars.space.sp4 });

// `hr` is the one element the reset leaves alone, so it still carries the browser's inset
// border and default margins. Normalise it to a single hairline rule in the decorative
// border colour, with the section-break spacing a rule earns on both sides.
proseStyle('hr', {
	blockSize: 0,
	border: 'none',
	borderBlockStart: `1px solid ${vars.color.border.decorative}`,
	marginBlockEnd: vars.space.sp48,
});

// Top margins, keyed off a preceding sibling so the first child of the container never
// carries one. A heading takes more room above it than below it, so it reads as opening the
// section that follows rather than floating between two. The other blocks here are set off
// from body text on both sides, so they take the same margin above as below.
proseStyle('* + h1, * + h2', { marginBlockStart: vars.space.sp48 });
proseStyle('* + h3', { marginBlockStart: vars.space.sp32 });
proseStyle('* + h4, * + h5, * + h6', { marginBlockStart: vars.space.sp24 });
proseStyle('* + hr', { marginBlockStart: vars.space.sp48 });
proseStyle('* + blockquote, * + pre, * + figure', { marginBlockStart: vars.space.sp24 });
proseStyle('* + table', { marginBlockStart: vars.space.sp32 });
proseStyle('* + dt', { marginBlockStart: vars.space.sp16 });

// A heading's bottom margin is the whole gap to what follows, so the next element must not
// add to it. This rule follows the `* + heading` block deliberately: every rule here carries
// the same specificity, so source order decides, and a heading after a heading takes the
// smaller in-section gap rather than a full section break.
globalStyleInLayer('recipes', `${root} :where(h1, h2, h3, h4, h5, h6) + *`, {
	marginBlockStart: 0,
});

// Prose adds no space outside itself, so a caller composes it without measuring what its
// first and last blocks happen to be.
globalStyleInLayer('recipes', `${root} > :where(:first-child)`, { marginBlockStart: 0 });
globalStyleInLayer('recipes', `${root} > :where(:last-child)`, { marginBlockEnd: 0 });

// The reset strips list markers and indent from every `ol`/`ul`, which is right for the
// menus and navigation that make up most lists in an interface. A document needs them
// back, along with the conventional alternating markers for nesting.
proseStyle('ul', { listStyle: 'disc', paddingInlineStart: vars.space.sp24 });
proseStyle('ol', { listStyle: 'decimal', paddingInlineStart: vars.space.sp24 });
proseStyle('ul ul', { listStyleType: 'circle' });
proseStyle('ul ul ul', { listStyleType: 'square' });
proseStyle('ol ol', { listStyleType: 'lower-alpha' });
proseStyle('ol ol ol', { listStyleType: 'lower-roman' });

// A nested list belongs to the item above it, so it sits closer than a sibling paragraph
// would and closes the group rather than opening a gap before the next item.
proseStyle('li > ul, li > ol', {
	marginBlockEnd: 0,
	marginBlockStart: vars.space.sp8,
});

// The reset zeroes cell padding, which suits the layout tables an interface builds by hand.
// A document's table is read as data, so its columns need to be separated to be legible at
// all. The header row takes the decorative rule the rest of the document uses.
proseStyle('th, td', {
	paddingBlock: vars.space.sp8,
	paddingInline: vars.space.sp12,
});
proseStyle('th', { textAlign: 'start' });
proseStyle('thead th', {
	borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
});

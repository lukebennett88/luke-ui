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

/**
 * Every part of every selector is wrapped in `:where()`, the root class included, so each rule
 * contributes 0-0-0. An element name is worth 0-0-1 on its own, so the matched element is
 * wrapped too rather than trailing the `:where()`. A consumer overrides any of this with a
 * plain class on the element itself, which is the whole point of a public prose component:
 * markup it does not control still has to be adjustable.
 */
function proseStyle(selector: string, rule: Parameters<typeof globalStyleInLayer>[2]) {
	globalStyleInLayer('recipes', `:where(.${base}) :where(${selector})`, rule);
}

// Every gap belongs to the following sibling. No element inside `Prose` carries a block-end
// margin, so a single authored `margin-block-start` is the whole distance between two blocks.
// Nothing collapses, which keeps the rhythm identical whether the root lays out as block,
// grid, or flex; nothing trails, so no margin escapes the container; and the first block needs
// no exception, because no `* +` rule can match an element with no preceding sibling.

// Step one: clear the browser's own margins, in both directions, at any depth. `pre` and `hr`
// are the two the shared reset leaves alone, and a `pre` inside a `blockquote` is reached by
// neither a first-child nor a sibling rule, so the sweep has to be unconditional.
proseStyle('*', { marginBlock: 0 });

// Step two: one lead-in margin per adjacent pair. Body blocks share the paragraph gap; a
// heading takes more room above itself so it reads as opening the section that follows.
proseStyle('* + p, * + ul, * + ol, * + dl', { marginBlockStart: vars.space.sp24 });
proseStyle('* + h1, * + h2', { marginBlockStart: vars.space.sp48 });
proseStyle('* + h3', { marginBlockStart: vars.space.sp32 });
proseStyle('* + h4, * + h5, * + h6', { marginBlockStart: vars.space.sp24 });
proseStyle('* + blockquote, * + pre, * + figure', { marginBlockStart: vars.space.sp24 });
proseStyle('* + table', { marginBlockStart: vars.space.sp32 });
proseStyle('* + hr', { marginBlockStart: vars.space.sp48 });
proseStyle('* + li', { marginBlockStart: vars.space.sp8 });
proseStyle('* + dt', { marginBlockStart: vars.space.sp16 });
proseStyle('* + dd', { marginBlockStart: vars.space.sp4 });
proseStyle('* + figcaption', { marginBlockStart: vars.space.sp8 });

// A heading groups with what follows, so the block after one takes a smaller gap than its own
// lead-in would give. These rules follow the lead-in block deliberately: every rule here
// carries the same zero specificity, so source order alone decides. That ordering also means a
// heading after a heading takes the smaller in-section gap rather than a full section break.
proseStyle(':where(h1, h2) + *', { marginBlockStart: vars.space.sp16 });
proseStyle(':where(h3, h4) + *', { marginBlockStart: vars.space.sp12 });
proseStyle(':where(h5, h6) + *', { marginBlockStart: vars.space.sp8 });

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
// would. It is the first child of its `li`, so no lead-in rule reaches it.
proseStyle('li > ul, li > ol', { marginBlockStart: vars.space.sp8 });

// `hr` keeps the browser's inset border even after the reset, so normalise it to a single
// hairline rule in the decorative border colour.
proseStyle('hr', {
	blockSize: 0,
	border: 'none',
	borderBlockStart: `1px solid ${vars.color.border.decorative}`,
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

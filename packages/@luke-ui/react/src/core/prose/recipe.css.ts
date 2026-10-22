import { createVar } from '@vanilla-extract/css';
import { vars } from '../../theme/contract.css.js';
import type { FontWeightRole, TypeStyle } from '../../theme/type-styles.js';
import { typeStyleWeightRole } from '../../theme/type-styles.js';
import { blockquoteAppearance } from '../blockquote/appearance.js';
import { blockquoteElementClassName } from '../blockquote/recipe.css.js';
import { codeAppearance } from '../code/appearance.js';
import { codeElementClassName } from '../code/recipe.css.js';
import {
	headingDefaultFontWeight,
	headingTypographyByLevel,
} from '../heading/heading-typography.js';
import { kbdAppearance } from '../kbd/appearance.js';
import { kbdElementClassName } from '../kbd/recipe.css.js';
import { actionElementClassName } from '../primitives/button/recipe.css.js';
import { textLinkAppearance } from '../primitives/button/text-action-appearance.js';
import { globalStyleInLayer, style } from '../styles/layered-style.css.js';
import { recipe } from '../styles/recipe.js';
import { surfaceStyle } from '../styles/surface.js';
import { textElementClassName } from '../text/recipe.css.js';
import { typeStyleFontDeclarations, typeStyleTrimVars } from '../text/type-style-declarations.js';

const proseScopeClassName = style({}, 'prose');

/**
 * Every Prose rule is scoped to the Prose class, and `proseRecipe()` applies it as its base, so
 * `<Prose>` and recipe-only usage scope identically.
 */
export const proseRecipe = recipe({ base: proseScopeClassName });

// Every rule sits in an `@scope` from the Prose class to the `not-prose` class. The limit excludes
// a `not-prose` element and everything under it, and a nested Prose starts its own scope, so it
// applies again inside the boundary. `:where()` on the match and the implicit scope root add no
// specificity, so recipe and utility classes win on specificity as well as on layer order.
const proseScope = `(.${proseScopeClassName})`;

function proseStyle(
	selector: string,
	rule: Parameters<typeof globalStyleInLayer>[2],
	// A pseudo-element cannot sit inside `:where()`, so it follows it.
	pseudoElement = '',
) {
	globalStyleInLayer('recipes', `:where(${selector})${pseudoElement}`, {
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
proseStyle('* + p, * + ul, * + ol, * + dl, * + h1', { marginBlockStart: vars.space['32'] });
proseStyle('* + h2, * + hr', { marginBlockStart: vars.space['64'] });
proseStyle('* + h3, * + blockquote, * + table, * + figure, * + img, * + picture, * + video', {
	marginBlockStart: vars.space['40'],
});
proseStyle('* + h4, * + h5, * + h6, * + pre', { marginBlockStart: vars.space['32'] });
proseStyle('* + li, * + dd', { marginBlockStart: vars.space['12'] });
proseStyle('* + dt', { marginBlockStart: vars.space['32'] });
proseStyle('* + figcaption, li > ul, li > ol, li > p + p', {
	marginBlockStart: vars.space['16'],
});

proseStyle('h1 + *', { marginBlockStart: vars.space['40'] });
proseStyle('h1 + h2, h1 + hr', { marginBlockStart: vars.space['64'] });
proseStyle('h2 + *', { marginBlockStart: vars.space['32'] });
proseStyle('h3 + *', { marginBlockStart: vars.space['24'] });
proseStyle('h4 + *, h5 + *, h6 + *', { marginBlockStart: vars.space['16'] });
// A rule is a section break on both sides.
proseStyle('hr + *', { marginBlockStart: vars.space['64'] });

proseStyle('img, picture, video', { display: 'block' });
proseStyle('img, video', { blockSize: 'auto', maxInlineSize: '100%' });
proseStyle('picture', { maxInlineSize: '100%' });
proseStyle('figure > img, figure > picture, figure > video, picture > img', {
	marginBlockStart: 0,
});

// Exclude recipe-owned elements: scope proximity otherwise beats equal-specificity recipes. A plain
// link looks like a standard text `Link`: underlined in every state, in the surrounding context's
// colours.
const plainLink = `a[href]:not(.${actionElementClassName}):not(.${textElementClassName})`;
const linkAppearance = textLinkAppearance('neutral', 'standard');
proseStyle(plainLink, {
	...linkAppearance.rest,
	font: 'inherit',
	padding: 0,
	textDecorationColor: 'currentColor',
	transitionDuration: vars.motion.feedback.duration,
	transitionProperty: 'color, text-decoration-color',
	transitionTimingFunction: vars.motion.feedback.easing,
	'@media': { '(forced-colors: active)': { color: 'LinkText', forcedColorAdjust: 'auto' } },
});
proseStyle(`${plainLink}:hover`, {
	...linkAppearance.hover,
	'@media': { '(forced-colors: active)': { color: 'LinkText' } },
});
proseStyle(`${plainLink}:active`, {
	...linkAppearance.pressed,
	'@media': { '(forced-colors: active)': { color: 'LinkText' } },
});
proseStyle(`${plainLink}:focus-visible`, linkAppearance.focus);
proseStyle(`code:not(pre code):not(.${codeElementClassName}):not(.${textElementClassName})`, {
	...codeAppearance,
	whiteSpace: 'normal',
	overflowWrap: 'anywhere',
});
proseStyle(`kbd:not(.${kbdElementClassName}):not(.${textElementClassName})`, kbdAppearance);
proseStyle(
	`blockquote:not(.${blockquoteElementClassName}):not(.${textElementClassName})`,
	blockquoteAppearance,
);

// A code block is a neutral subtle fill with its own foreground context, like inline `Code`. Code
// inside it takes the block's colours and draws no chip of its own.
proseStyle('pre', {
	...surfaceStyle('neutral.subtle.rest'),
	border: `1px solid ${vars.color.border.decorative}`,
	borderRadius: vars.radius.control,
	fontFamily: vars.font.family.code,
	// Label matches inline `Code` at body size (`0.875em` of 16px) without the monospace optical
	// correction reading large at the inherited body metrics.
	fontSize: vars.font.label.fontSize,
	lineHeight: vars.font.label.lineHeight,
	maxInlineSize: '100%',
	minInlineSize: 0,
	overflowX: 'auto',
	paddingBlock: vars.space['12'],
	paddingInline: vars.space['16'],
	whiteSpace: 'pre',
});

// Nested `code` keeps the pre metrics. Without a reset, the UA `font-family: monospace` on `code`
// can replace the stack and trigger the nested-monospace size quirk Preflight used to correct.
proseStyle('pre code', {
	fontFamily: 'inherit',
	fontSize: 'inherit',
	lineHeight: 'inherit',
});

// Markers are restated so a framework reset below Luke UI, such as Tailwind Preflight, cannot
// remove them. That reset also beats the HTML `type` hint, so typed lists restate the HTML rendering
// rules for `type`. HTML matches `type` case-insensitively unless a selector uses the `s` flag.
// Where `s` is unsupported (Chromium), those typed rules match nothing. The presentational hint
// remains, but an author list reset still beats it, so letter and roman markers stay `none`.
proseStyle('ul, ol', { paddingInlineStart: vars.space['24'] });
proseStyle('ul', { listStyleType: 'disc' });
proseStyle('ol:not([type]), ol[type="1"]', { listStyleType: 'decimal' });
proseStyle('ol[type="a" s]', { listStyleType: 'lower-alpha' });
proseStyle('ol[type="A" s]', { listStyleType: 'upper-alpha' });
proseStyle('ol[type="i" s]', { listStyleType: 'lower-roman' });
proseStyle('ol[type="I" s]', { listStyleType: 'upper-roman' });

proseStyle('hr', {
	blockSize: 0,
	border: 'none',
	borderBlockStart: `1px solid ${vars.color.border.decorative}`,
});
// A table scrolls inside its own box only as a block, so a narrow table takes its content width
// instead of filling the line. `fit-content` rather than `max-content`, so a table of wrapping text
// does not widen an auto-sized grid or flex track. CMS markup can't wrap a table in a scroller.
proseStyle('table', {
	borderCollapse: 'collapse',
	borderSpacing: 0,
	display: 'block',
	inlineSize: 'fit-content',
	maxInlineSize: '100%',
	overflowX: 'auto',
});
proseStyle('th, td', { paddingBlock: vars.space['8'], paddingInline: vars.space['12'] });
proseStyle('caption, th', { textAlign: 'start' });
proseStyle('thead th', {
	borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
	verticalAlign: 'bottom',
});
proseStyle('tbody td', { verticalAlign: 'baseline' });
proseStyle('tbody tr + tr, tfoot', {
	borderBlockStart: `1px solid ${vars.color.border.decorative}`,
});

// Plain headings and paragraphs get the type style `Heading` and `Text` give them, trim included.
// `Heading` and `Text` carry `textElementClassName` and are excluded, so they keep their own props.
// The level map, the weight roles, and the font and trim declarations belong to `Heading` and
// `Text`, so nothing here names a type style or a weight.
interface PlainElement {
	element: string;
	typography: TypeStyle;
	weightRole: FontWeightRole;
}
const plainElements: ReadonlyArray<PlainElement> = [
	...(Object.entries(headingTypographyByLevel) as Array<[string, TypeStyle]>).map(
		([level, typography]) => {
			return { element: `h${level}`, typography, weightRole: headingDefaultFontWeight };
		},
	),
	{ element: 'p', typography: 'body', weightRole: typeStyleWeightRole.body },
];

// `:is()` shares the exclusion across a list, and `:where()` keeps the whole match at zero
// specificity.
function plain(elements: ReadonlyArray<string>) {
	if (elements.length === 1) return `${elements[0]}:not(.${textElementClassName})`;

	return `:is(${elements.join(',')}):not(.${textElementClassName})`;
}

function groupElementsBy<Key extends string>(key: (entry: PlainElement) => Key) {
	const groups = new Map<Key, Array<string>>();
	for (const entry of plainElements) {
		const group = groups.get(key(entry));
		if (group) group.push(entry.element);
		else groups.set(key(entry), [entry.element]);
	}

	return groups;
}

// Each font rule hands its Capsize trims to the single pair of pseudo-element rules below.
const capHeightTrim = createVar();
const baselineTrim = createVar();

for (const [typography, elements] of groupElementsBy((entry) => entry.typography)) {
	const trims = typeStyleTrimVars(typography);
	proseStyle(plain(elements), {
		...typeStyleFontDeclarations(typography),
		vars: { [baselineTrim]: trims.baselineTrim, [capHeightTrim]: trims.capHeightTrim },
	});
}
for (const [weightRole, elements] of groupElementsBy((entry) => entry.weightRole)) {
	proseStyle(plain(elements), { fontWeight: vars.font.weight[weightRole] });
}

// A list marker and a cell baseline align to the first box, and the trim box comes first, so a
// paragraph directly in `li`, `td`, or `th` skips the trim.
const trimmedElements = `${plain(plainElements.map(({ element }) => element))}:not(:is(li, td, th) > *)`;
proseStyle(
	trimmedElements,
	{ content: "''", display: 'table', marginBlockEnd: capHeightTrim },
	'::before',
);
proseStyle(
	trimmedElements,
	{ content: "''", display: 'table', marginBlockStart: baselineTrim },
	'::after',
);

proseBoundaryGapStyle(['h1'], vars.space['40']);
proseBoundaryGapStyle(['h2'], vars.space['32']);
proseBoundaryGapStyle(['h3'], vars.space['24']);
proseBoundaryGapStyle(['h4', 'h5', 'h6'], vars.space['16']);
proseBoundaryGapStyle(['hr'], vars.space['64']);

import type { ComplexStyleRule } from '@vanilla-extract/css';
import { createVar } from '@vanilla-extract/css';
import { vars } from '../../theme/contract.css.js';
import type { FontWeightRole, TypeStyle } from '../../theme/type-styles.js';
import { typeStyles } from '../../theme/type-styles.js';
import { globalStyleInLayer, style } from '../styles/layered-style.css.js';
import type { RecipeSelection } from '../styles/recipe-types.js';
import { recipe } from '../styles/recipe.js';
import { contextualForeground } from '../styles/surface.js';
import { typeStyleFontDeclarations, typeStyleTrimVars } from './type-style-declarations.js';

/** Marks every element `textRecipe` styles, so the margin rule below can match it. */
export const textElementClassName = style({}, 'text');

// `Text` renders headings, paragraphs, and blockquotes, which have user agent margins. Spacing
// between them belongs to layout, so `Text` removes them. `:where()` keeps this at zero
// specificity, so Prose's scoped rules and other recipe margins override it.
globalStyleInLayer('recipes', `:where(.${textElementClassName})`, { margin: 0 });

const lineClampNone = {} satisfies ComplexStyleRule;
export const textLineHeight = createVar();
const lineClampSingleLine = {
	display: 'block',
	minInlineSize: 0,
	overflowX: 'clip',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
} satisfies ComplexStyleRule;
const lineClampMultiLine = (lines: number) => {
	return {
		WebkitBoxOrient: 'vertical',
		WebkitLineClamp: lines,
		display: '-webkit-box',
		lineClamp: lines,
		minInlineSize: 0,
		overflow: 'hidden',
	} satisfies ComplexStyleRule;
};

const lineClampVariants = {
	false: lineClampNone,
	true: lineClampSingleLine,
	1: lineClampSingleLine,
	2: lineClampMultiLine(2),
	3: lineClampMultiLine(3),
	4: lineClampMultiLine(4),
	5: lineClampMultiLine(5),
} as const;

// Each colour reads the nearest recognised surface, so `primary` resets to that surface's primary
// and a semantic role keeps its hue on a standard surface or subtle fill but reads on-solid colour
// on a solid fill. With no `color`, Text sets none and inherits.
const colorVariants = {
	accent: { color: contextualForeground('accent') },
	danger: { color: contextualForeground('danger') },
	info: { color: contextualForeground('info') },
	neutral: { color: contextualForeground('neutral') },
	primary: { color: contextualForeground('primary') },
	secondary: { color: contextualForeground('secondary') },
	success: { color: contextualForeground('success') },
	warning: { color: contextualForeground('warning') },
} as const;

const weightVariants = {
	body: { fontWeight: vars.font.weight.body },
	emphasis: { fontWeight: vars.font.weight.emphasis },
	heading: { fontWeight: vars.font.weight.heading },
	label: { fontWeight: vars.font.weight.label },
} satisfies Record<FontWeightRole, { fontWeight: string }>;

function typographyVariant(typography: TypeStyle) {
	const declarations = typeStyleFontDeclarations(typography);
	return { ...declarations, vars: { [textLineHeight]: declarations.lineHeight } };
}

const typographyVariants = {
	body: typographyVariant('body'),
	caption: typographyVariant('caption'),
	display: typographyVariant('display'),
	heading1: typographyVariant('heading1'),
	heading2: typographyVariant('heading2'),
	heading3: typographyVariant('heading3'),
	heading4: typographyVariant('heading4'),
	label: typographyVariant('label'),
	lead: typographyVariant('lead'),
} satisfies Record<
	TypeStyle,
	{
		fontFamily: string;
		fontSize: string;
		letterSpacing: string;
		lineHeight: string;
		vars: { [textLineHeight]: string };
	}
>;

const typographyCompoundVariants = typeStyles.map((typography) => {
	const { fontSize, lineHeight } = typeStyleFontDeclarations(typography);
	// The trims depend on the theme's font, so the theme stylesheet supplies them as private
	// variables rather than public tokens.
	const { baselineTrim, capHeightTrim } = typeStyleTrimVars(typography);
	return {
		style: createLayeredTextStyle({ baselineTrim, capHeightTrim, fontSize, lineHeight }),
		// `shouldInheritFont: true` asks the browser to resolve font size and line height from
		// the surrounding context, not this style's Capsize metrics. Without this condition, the
		// compound's own `fontSize`/`lineHeight` always wins over the plain `shouldInheritFont`
		// variant, because vanilla-extract applies compound variants after simple ones.
		variants: { shouldDisableTrim: false, shouldInheritFont: false, typography } as const,
	};
});

function createLayeredTextStyle({
	baselineTrim,
	capHeightTrim,
	fontSize,
	lineHeight,
}: {
	baselineTrim: string;
	capHeightTrim: string;
	fontSize: string;
	lineHeight: string;
}) {
	// The trim boxes use `flow-root`, not `table`. Chromium takes the first baseline of a block
	// from an empty `display: table` pseudo-element, which breaks baseline alignment beside trimmed
	// text. `flow-root` still forms a formatting context, so the negative margins cannot collapse
	// through the box.
	return {
		fontSize,
		lineHeight,
		selectors: {
			'&::before': {
				content: "''",
				display: 'flow-root',
				marginBlockEnd: capHeightTrim,
			},
			'&::after': {
				content: "''",
				display: 'flow-root',
				marginBlockStart: baselineTrim,
			},
		},
	} satisfies ComplexStyleRule;
}

export const textRecipe = recipe({
	base: [
		textElementClassName,
		{
			fontFamily: vars.font.family.body,
			// `Text` renders untransformed text with the font's default numerals unless asked otherwise.
			// These sit in the base rather than in a default variant so `shouldInheritFont` can override
			// them: a composed `Code`/`Em`/`Kbd`/`Strong` keeps the surrounding case and numeric styling,
			// while a plain `Text` is still insulated from whatever the page sets around it.
			fontVariantNumeric: 'normal',
			minInlineSize: 0,
			overflowWrap: 'break-word',
			textTransform: 'none',
		},
	],
	compoundVariants: typographyCompoundVariants,
	defaultVariants: {
		fontStyle: 'default',
		fontVariantNumeric: 'default',
		lineClamp: false,
		shouldDisableTrim: false,
		shouldInheritFont: false,
		textAlign: 'start',
		textDecoration: 'none',
		textTransform: 'default',
		textWrap: 'default',
		typography: 'body',
	},
	variants: {
		textWrap: {
			balance: { textWrap: 'balance' },
			pretty: { textWrap: 'pretty' },
			default: {},
		},
		// Keep `lineClamp` after `textWrap`. A single-line clamp truncates to one line with an
		// ellipsis, which needs its `white-space: nowrap` to win over `text-wrap: balance`/`pretty`
		// — both set the `text-wrap-mode` longhand, and that tie breaks on declaration order. A
		// multi-line clamp sets no wrapping property, so `textWrap` still applies under it.
		lineClamp: lineClampVariants,
		shouldDisableTrim: { false: {}, true: {} },
		textAlign: {
			center: { textAlign: 'center' },
			end: { textAlign: 'end' },
			start: { textAlign: 'start' },
		},
		textDecoration: {
			inherit: { textDecoration: 'inherit' },
			'line-through': { textDecoration: 'line-through' },
			none: { textDecoration: 'none' },
			underline: { textDecoration: 'underline' },
		},
		typography: typographyVariants,
		shouldInheritFont: {
			false: {},
			true: {
				fontFamily: 'inherit',
				fontSize: 'inherit',
				fontStyle: 'inherit',
				fontVariantNumeric: 'inherit',
				fontWeight: 'inherit',
				letterSpacing: 'inherit',
				lineHeight: 'inherit',
				textTransform: 'inherit',
				vars: { [textLineHeight]: '1lh' },
			},
		},
		// Keep these after `shouldInheritFont`. They must win over its `inherit` values, and that tie
		// breaks on declaration order. Each `default` emits nothing, so an unset prop leaves whatever
		// came before it standing: the base reset for a plain `Text`, or the inherited value under
		// `shouldInheritFont`.
		fontWeight: weightVariants,
		fontStyle: {
			inherit: { fontStyle: 'inherit' },
			italic: { fontStyle: 'italic' },
			normal: { fontStyle: 'normal' },
			default: {},
		},
		fontVariantNumeric: {
			'diagonal-fractions': { fontVariantNumeric: 'diagonal-fractions' },
			normal: { fontVariantNumeric: 'normal' },
			ordinal: { fontVariantNumeric: 'ordinal' },
			'slashed-zero': { fontVariantNumeric: 'slashed-zero' },
			'tabular-nums': { fontVariantNumeric: 'tabular-nums' },
			default: {},
		},
		textTransform: {
			capitalize: { textTransform: 'capitalize' },
			inherit: { textTransform: 'inherit' },
			lowercase: { textTransform: 'lowercase' },
			none: { textTransform: 'none' },
			uppercase: { textTransform: 'uppercase' },
			default: {},
		},
		color: colorVariants,
	},
});

/** Aggregate variant type for the `Text` recipe. */
export type TextRecipeVariants = RecipeSelection<typeof textRecipe>;

import type { ComplexStyleRule } from '@vanilla-extract/css';
import { createVar } from '@vanilla-extract/css';
import { vars } from '../../theme/contract.css.js';
import type { FontWeightRole, TypeStyle } from '../../theme/contract.js';
import { fontWeightRoles, typeStyles } from '../../theme/contract.js';
import type { RecipeSelection } from '../styles/recipe.js';
import { recipe } from '../styles/recipe.js';
import { visuallyHiddenStyle } from '../visually-hidden/recipe.css.js';

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

const colorVariants = {
	accent: { color: vars.color.foreground.accent.rest },
	danger: { color: vars.color.foreground.danger.rest },
	info: { color: vars.color.foreground.info.rest },
	primary: { color: vars.color.text.primary },
	secondary: { color: vars.color.text.secondary },
	success: { color: vars.color.foreground.success.rest },
	warning: { color: vars.color.foreground.warning.rest },
} as const;

const weightVariants = Object.fromEntries(
	fontWeightRoles.map((fontWeight) => [fontWeight, { fontWeight: vars.font.weight[fontWeight] }]),
) as Record<FontWeightRole, { fontWeight: string }>;

const typographyVariants = Object.fromEntries(
	typeStyles.map((typography) => [
		typography,
		{
			fontFamily: vars.font[typography].fontFamily,
			fontSize: vars.font[typography].fontSize,
			letterSpacing: vars.font[typography].letterSpacing,
			lineHeight: vars.font[typography].lineHeight,
			vars: { [textLineHeight]: vars.font[typography].lineHeight },
		},
	]),
) as Record<
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
	const { baselineTrim, capHeightTrim, fontSize, lineHeight } = vars.font[typography];
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
	return {
		fontSize,
		lineHeight,
		selectors: {
			'&::before': {
				content: "''",
				display: 'table',
				marginBlockEnd: capHeightTrim,
			},
			'&::after': {
				content: "''",
				display: 'table',
				marginBlockStart: baselineTrim,
			},
		},
	} satisfies ComplexStyleRule;
}

export const textRecipe = recipe({
	base: {
		color: vars.color.text.primary,
		fontFamily: vars.font.family.body,
		minInlineSize: 0,
		overflowWrap: 'break-word',
	},
	compoundVariants: typographyCompoundVariants,
	defaultVariants: {
		fontStyle: 'default',
		fontVariantNumeric: 'default',
		isVisuallyHidden: false,
		lineClamp: false,
		shouldDisableTrim: false,
		shouldInheritFont: false,
		textAlign: 'start',
		textDecoration: 'none',
		textTransform: 'none',
		textWrap: 'default',
		typography: 'body',
	},
	variants: {
		fontVariantNumeric: {
			'diagonal-fractions': { fontVariantNumeric: 'diagonal-fractions' },
			ordinal: { fontVariantNumeric: 'ordinal' },
			'slashed-zero': { fontVariantNumeric: 'slashed-zero' },
			'tabular-nums': { fontVariantNumeric: 'tabular-nums' },
			default: { fontVariantNumeric: 'normal' },
		},
		isVisuallyHidden: {
			false: {},
			true: visuallyHiddenStyle,
		},
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
		textTransform: {
			capitalize: { textTransform: 'capitalize' },
			inherit: { textTransform: 'inherit' },
			lowercase: { textTransform: 'lowercase' },
			none: { textTransform: 'none' },
			uppercase: { textTransform: 'uppercase' },
		},
		typography: typographyVariants,
		shouldInheritFont: {
			false: {},
			true: {
				color: 'inherit',
				fontFamily: 'inherit',
				fontSize: 'inherit',
				fontStyle: 'inherit',
				fontWeight: 'inherit',
				letterSpacing: 'inherit',
				lineHeight: 'inherit',
				vars: { [textLineHeight]: '1lh' },
			},
		},
		// Keep both of these after `shouldInheritFont`. They must win over its `inherit` values, and
		// that tie breaks on declaration order.
		fontWeight: weightVariants,
		fontStyle: {
			inherit: { fontStyle: 'inherit' },
			italic: { fontStyle: 'italic' },
			normal: { fontStyle: 'normal' },
			default: {},
		},
		color: colorVariants,
	},
});

/** Aggregate variant type for the `Text` recipe. */
export type TextRecipeVariants = RecipeSelection<typeof textRecipe>;

import type { ComplexStyleRule } from '@vanilla-extract/css';
import { createVar } from '@vanilla-extract/css';
import { styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';
import type { FontWeightRole, TypeStyle } from '../theme/contract.js';
import { fontWeightRoles, typeStyles } from '../theme/contract.js';
import type { RecipeSelection } from './recipe.js';
import { recipe } from './recipe.js';
import { visuallyHiddenStyle } from './visually-hidden.css.js';

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

const base = styleInLayer('recipes', {
	color: vars.color.text.primary,
	fontFamily: vars.font.family.body,
	minInlineSize: 0,
	overflowWrap: 'break-word',
});

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

/** Vanilla-extract recipe for the `Text` primitive's styles. */
export const text = recipe({
	base,
	compoundVariants: typographyCompoundVariants,
	defaultVariants: {
		fontVariantNumeric: 'unset',
		isVisuallyHidden: false,
		lineClamp: false,
		shouldDisableTrim: false,
		shouldInheritFont: false,
		textAlign: 'start',
		textDecoration: 'none',
		textTransform: 'none',
		textWrap: 'unset',
		typography: 'body',
	},
	variants: {
		fontVariantNumeric: {
			'diagonal-fractions': { fontVariantNumeric: 'diagonal-fractions' },
			ordinal: { fontVariantNumeric: 'ordinal' },
			'slashed-zero': { fontVariantNumeric: 'slashed-zero' },
			'tabular-nums': { fontVariantNumeric: 'tabular-nums' },
			unset: { fontVariantNumeric: 'normal' },
		},
		isVisuallyHidden: {
			false: {},
			true: visuallyHiddenStyle,
		},
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
		textWrap: {
			balance: { textWrap: 'balance' },
			pretty: { textWrap: 'pretty' },
			unset: {},
		},
		typography: typographyVariants,
		fontWeight: weightVariants,
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
		color: colorVariants,
	},
});

/** Aggregate variant type for the `Text` recipe. */
export type TextVariants = RecipeSelection<typeof text>;

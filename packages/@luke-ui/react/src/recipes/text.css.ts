import type { ComplexStyleRule } from '@vanilla-extract/css';
import { styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';
import { fontSizeSteps } from '../theme/contract.js';
import type { FontSizeStep } from '../theme/contract.js';
import type { RecipeSelection } from './recipe.js';
import { recipe } from './recipe.js';

/** Typography size steps. */
export type TextSize = FontSizeStep;

/** Semantic text colours. */
export type TextColor =
	| 'primary'
	| 'secondary'
	| 'accent'
	| 'info'
	| 'success'
	| 'warning'
	| 'danger';
/** Semantic font-weight roles. */
export type TextFontWeight = 'body' | 'label' | 'heading' | 'emphasis';
/** Logical text alignment values. */
export type TextAlign = 'start' | 'center' | 'end';
/** Text wrapping values. */
export type TextWrap = 'unset' | 'balance' | 'pretty';

const textDecorationKeys = ['none', 'underline', 'line-through', 'inherit'] as const;
/** Text decoration variant values. */
export type TextDecoration = (typeof textDecorationKeys)[number];

const textTransformKeys = ['none', 'capitalize', 'uppercase', 'lowercase', 'inherit'] as const;
/** Text transform variant values. */
export type TextTransform = (typeof textTransformKeys)[number];

const fontVariantNumericKeys = [
	'unset',
	'diagonal-fractions',
	'ordinal',
	'slashed-zero',
	'tabular-nums',
] as const;
/** Numeric glyph variant values. */
export type TextFontVariantNumeric = (typeof fontVariantNumericKeys)[number];

const lineClampNone = {} satisfies ComplexStyleRule;
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

/** Text line-clamp variant values. */
export type TextLineClampVariant = keyof typeof lineClampVariants;

const base = styleInLayer('recipes', {
	color: vars.color.text.primary,
	fontFamily: vars.font.family,
	minInlineSize: 0,
	overflowWrap: 'break-word',
});

const colorVariants = {
	accent: { color: vars.color.intent.accent.text },
	danger: { color: vars.color.intent.danger.text },
	info: { color: vars.color.intent.info.text },
	primary: { color: vars.color.text.primary },
	secondary: { color: vars.color.text.secondary },
	success: { color: vars.color.intent.success.text },
	warning: { color: vars.color.intent.warning.text },
} as const;

const weightVariants = {
	body: { fontWeight: vars.font.weight.body },
	emphasis: { fontWeight: vars.font.weight.emphasis },
	heading: { fontWeight: vars.font.weight.heading },
	label: { fontWeight: vars.font.weight.label },
} as const;

const sizeVariants = Object.fromEntries(
	fontSizeSteps.map((size) => [
		size,
		{
			fontSize: vars.font[size].fontSize,
			letterSpacing: vars.font[size].letterSpacing,
			lineHeight: vars.font[size].lineHeight,
		},
	]),
) as Record<TextSize, { fontSize: string; letterSpacing: string; lineHeight: string }>;

const sizeStepCompoundVariants = fontSizeSteps.map((size) => {
	const { baselineTrim, capHeightTrim, fontSize, lineHeight } = vars.font[size];
	return {
		style: createLayeredTextStyle({ baselineTrim, capHeightTrim, fontSize, lineHeight }),
		variants: { shouldDisableTrim: false, size } as const,
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
	compoundVariants: sizeStepCompoundVariants,
	defaultVariants: {
		fontVariantNumeric: 'unset',
		isVisuallyHidden: false,
		lineClamp: false,
		shouldDisableTrim: false,
		shouldInheritFont: false,
		size: '300',
		textAlign: 'start',
		textDecoration: 'none',
		textTransform: 'none',
		textWrap: 'unset',
		fontWeight: 'body',
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
			true: { position: 'absolute', transform: 'scale(0)' },
		},
		lineClamp: lineClampVariants,
		shouldDisableTrim: { false: {}, true: {} },
		size: sizeVariants,
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
			},
		},
		color: colorVariants,
	},
});

/** Aggregate variant type for the `Text` recipe. */
export type TextVariants = RecipeSelection<typeof text>;

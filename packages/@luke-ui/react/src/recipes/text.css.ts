import type { ComplexStyleRule } from '@vanilla-extract/css';
import { createVar } from '@vanilla-extract/css';
import { styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';
import type { TypeStyle } from '../theme/contract.js';
import { typeStyles } from '../theme/contract.js';
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

const weightVariants = {
	body: { fontWeight: vars.font.weight.body },
	emphasis: { fontWeight: vars.font.weight.emphasis },
	heading: { fontWeight: vars.font.weight.heading },
	label: { fontWeight: vars.font.weight.label },
} as const;

const sizeVariants = Object.fromEntries(
	typeStyles.map((size) => [
		size,
		{
			fontFamily: vars.font[size].fontFamily,
			fontSize: vars.font[size].fontSize,
			fontWeight: vars.font[size].fontWeight,
			letterSpacing: vars.font[size].letterSpacing,
			lineHeight: vars.font[size].lineHeight,
			vars: { [textLineHeight]: vars.font[size].lineHeight },
		},
	]),
) as Record<
	TypeStyle,
	{
		fontFamily: string;
		fontSize: string;
		fontWeight: string;
		letterSpacing: string;
		lineHeight: string;
		vars: { [textLineHeight]: string };
	}
>;

const sizeStepCompoundVariants = typeStyles.map((size) => {
	const { baselineTrim, capHeightTrim, fontSize, lineHeight } = vars.font[size];
	return {
		style: createLayeredTextStyle({ baselineTrim, capHeightTrim, fontSize, lineHeight }),
		// `shouldInheritFont: true` asks the browser to resolve font size and line height from
		// the surrounding context, not this style's Capsize metrics. Without this condition, the
		// compound's own `fontSize`/`lineHeight` always wins over the plain `shouldInheritFont`
		// variant, because vanilla-extract applies compound variants after simple ones.
		variants: { shouldDisableTrim: false, shouldInheritFont: false, size } as const,
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
		size: 'body',
		textAlign: 'start',
		textDecoration: 'none',
		textTransform: 'none',
		textWrap: 'unset',
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
		// Declared after `size` so an explicit weight override wins over the type style's weight.
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

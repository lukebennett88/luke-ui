import type { FontSizeStep } from '../theme/contract.js';
import { fontSizeSteps } from '../theme/contract.js';

const lineClampNone = {};
const lineClampSingleLine = {
	display: 'block',
	minInlineSize: 0,
	overflowX: 'clip',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
};
const lineClampMultiLine = (lines: number) => ({
	WebkitBoxOrient: 'vertical',
	WebkitLineClamp: lines,
	display: '-webkit-box',
	lineClamp: lines,
	minInlineSize: 0,
	overflow: 'hidden',
});

export const textLineClampVariants = {
	false: lineClampNone,
	true: lineClampSingleLine,
	1: lineClampSingleLine,
	2: lineClampMultiLine(2),
	3: lineClampMultiLine(3),
	4: lineClampMultiLine(4),
	5: lineClampMultiLine(5),
};

export type TextLineClampValue = {
	[Key in keyof typeof textLineClampVariants]: Key extends 'false'
		? false
		: Key extends 'true'
			? true
			: Key extends number
				? Key
				: never;
}[keyof typeof textLineClampVariants];

export const textSizeVariants = Object.fromEntries(
	fontSizeSteps.map((size) => [size, { fontSize: size, letterSpacing: size, lineHeight: size }]),
) as Record<FontSizeStep, { fontSize: string; letterSpacing: string; lineHeight: string }>;
export type TextSizeValue = keyof typeof textSizeVariants;

export const textFontVariantNumericVariants = {
	'diagonal-fractions': { fontVariantNumeric: 'diagonal-fractions' },
	ordinal: { fontVariantNumeric: 'ordinal' },
	'slashed-zero': { fontVariantNumeric: 'slashed-zero' },
	'tabular-nums': { fontVariantNumeric: 'tabular-nums' },
	unset: { fontVariantNumeric: 'normal' },
};
export type TextFontVariantNumericValue = keyof typeof textFontVariantNumericVariants;

export const textAlignVariants = {
	center: { textAlign: 'center' },
	end: { textAlign: 'end' },
	start: { textAlign: 'start' },
};
export type TextAlignValue = keyof typeof textAlignVariants;

export const textDecorationVariants = {
	inherit: { textDecoration: 'inherit' },
	'line-through': { textDecoration: 'line-through' },
	none: { textDecoration: 'none' },
	underline: { textDecoration: 'underline' },
};
export type TextDecorationValue = keyof typeof textDecorationVariants;

export const textTransformVariants = {
	capitalize: { textTransform: 'capitalize' },
	inherit: { textTransform: 'inherit' },
	lowercase: { textTransform: 'lowercase' },
	none: { textTransform: 'none' },
	uppercase: { textTransform: 'uppercase' },
};
export type TextTransformValue = keyof typeof textTransformVariants;

export const textWrapVariants = {
	balance: { textWrap: 'balance' },
	pretty: { textWrap: 'pretty' },
	unset: {},
};
export type TextWrapValue = keyof typeof textWrapVariants;

export const textFontWeightVariants = {
	body: { fontWeight: 'body' },
	emphasis: { fontWeight: 'emphasis' },
	heading: { fontWeight: 'heading' },
	label: { fontWeight: 'label' },
};
export type TextFontWeightValue = keyof typeof textFontWeightVariants;

export const textColorVariants = {
	accent: { color: 'intent.accent.text' },
	danger: { color: 'intent.danger.text' },
	info: { color: 'intent.info.text' },
	primary: { color: 'text.primary' },
	secondary: { color: 'text.secondary' },
	success: { color: 'intent.success.text' },
	warning: { color: 'intent.warning.text' },
};
export type TextColorValue = keyof typeof textColorVariants;

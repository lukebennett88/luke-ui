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
	'line-clamp': lines,
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

/** Text line-clamp variant values. */
export type TextLineClampVariant = {
	[Key in keyof typeof textLineClampVariants]: Key extends 'false'
		? false
		: Key extends 'true'
			? true
			: Key extends number
				? Key
				: never;
}[keyof typeof textLineClampVariants];

type TextLineClampKey =
	| Exclude<keyof typeof textLineClampVariants, number>
	| `${Extract<keyof typeof textLineClampVariants, number>}`;

export const textLineClampKeys = new Map<TextLineClampVariant, TextLineClampKey>([
	[false, 'false'],
	[true, 'true'],
	[1, '1'],
	[2, '2'],
	[3, '3'],
	[4, '4'],
	[5, '5'],
]);

export const textSizeVariants = Object.fromEntries(
	fontSizeSteps.map((size) => [size, { fontSize: size, letterSpacing: size, lineHeight: size }]),
) as Record<FontSizeStep, { fontSize: string; letterSpacing: string; lineHeight: string }>;
/** Typography size steps. */
export type TextSize = keyof typeof textSizeVariants;

export const textFontVariantNumericVariants = {
	'diagonal-fractions': { fontVariantNumeric: 'diagonal-fractions' },
	ordinal: { fontVariantNumeric: 'ordinal' },
	'slashed-zero': { fontVariantNumeric: 'slashed-zero' },
	'tabular-nums': { fontVariantNumeric: 'tabular-nums' },
	unset: { fontVariantNumeric: 'normal' },
};
/** Numeric glyph variant values. */
export type TextFontVariantNumeric = keyof typeof textFontVariantNumericVariants;

export const textAlignVariants = {
	center: { textAlign: 'center' },
	end: { textAlign: 'end' },
	start: { textAlign: 'start' },
};
/** Logical text alignment values. */
export type TextAlign = keyof typeof textAlignVariants;

export const textDecorationVariants = {
	inherit: { textDecoration: 'inherit' },
	'line-through': { textDecoration: 'line-through' },
	none: { textDecoration: 'none' },
	underline: { textDecoration: 'underline' },
};
/** Text decoration variant values. */
export type TextDecoration = keyof typeof textDecorationVariants;

export const textTransformVariants = {
	capitalize: { textTransform: 'capitalize' },
	inherit: { textTransform: 'inherit' },
	lowercase: { textTransform: 'lowercase' },
	none: { textTransform: 'none' },
	uppercase: { textTransform: 'uppercase' },
};
/** Text transform variant values. */
export type TextTransform = keyof typeof textTransformVariants;

export const textWrapVariants = {
	balance: { textWrap: 'balance' },
	pretty: { textWrap: 'pretty' },
	unset: {},
};
/** Text wrapping values. */
export type TextWrap = keyof typeof textWrapVariants;

export const textFontWeightVariants = {
	body: { fontWeight: 'body' },
	emphasis: { fontWeight: 'emphasis' },
	heading: { fontWeight: 'heading' },
	label: { fontWeight: 'label' },
};
/** Semantic font-weight roles. */
export type TextFontWeight = keyof typeof textFontWeightVariants;

export const textColorVariants = {
	accent: { color: 'intent.accent.text' },
	danger: { color: 'intent.danger.text' },
	info: { color: 'intent.info.text' },
	primary: { color: 'text.primary' },
	secondary: { color: 'text.secondary' },
	success: { color: 'intent.success.text' },
	warning: { color: 'intent.warning.text' },
};
/** Semantic text colours. */
export type TextColor = keyof typeof textColorVariants;

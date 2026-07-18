import { defineRecipe } from '@pandacss/dev';
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

const lineClampVariants = {
	false: lineClampNone,
	true: lineClampSingleLine,
	1: lineClampSingleLine,
	2: lineClampMultiLine(2),
	3: lineClampMultiLine(3),
	4: lineClampMultiLine(4),
	5: lineClampMultiLine(5),
};

const sizeVariants = Object.fromEntries(
	fontSizeSteps.map((size) => [size, { fontSize: size, letterSpacing: size, lineHeight: size }]),
) as Record<
	(typeof fontSizeSteps)[number],
	{ fontSize: string; letterSpacing: string; lineHeight: string }
>;

// These raw contract variables replicate Capsize's pseudo-element trims. They
// are not Panda tokens, and their compound CSS intentionally lands in @layer box.
const sizeStepCompoundVariants = fontSizeSteps.map((size) => ({
	shouldDisableTrim: false,
	size,
	css: {
		'&::before': {
			content: "''",
			display: 'table',
			marginBottom: `var(--luke-font-${size}-cap-height-trim)`,
		},
		'&::after': {
			content: "''",
			display: 'table',
			marginTop: `var(--luke-font-${size}-baseline-trim)`,
		},
	},
}));

export const textRecipe = defineRecipe({
	className: 'text',
	description: 'Typography scale and semantic styling for Text.',
	base: {
		color: 'text.primary',
		fontFamily: 'family',
		minInlineSize: 0,
		overflowWrap: 'break-word',
	},
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
		isVisuallyHidden: { false: {}, true: { position: 'absolute', transform: 'scale(0)' } },
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
		textWrap: { balance: { textWrap: 'balance' }, pretty: { textWrap: 'pretty' }, unset: {} },
		fontWeight: {
			body: { fontWeight: 'body' },
			emphasis: { fontWeight: 'emphasis' },
			heading: { fontWeight: 'heading' },
			label: { fontWeight: 'label' },
		},
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
		color: {
			accent: { color: 'intent.accent.text' },
			danger: { color: 'intent.danger.text' },
			info: { color: 'intent.info.text' },
			primary: { color: 'text.primary' },
			secondary: { color: 'text.secondary' },
			success: { color: 'intent.success.text' },
			warning: { color: 'intent.warning.text' },
		},
	},
});

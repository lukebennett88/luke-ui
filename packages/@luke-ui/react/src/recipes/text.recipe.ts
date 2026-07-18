import { defineRecipe } from '@pandacss/dev';
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

const textLineClampVariants = {
	false: lineClampNone,
	true: lineClampSingleLine,
	1: lineClampSingleLine,
	2: lineClampMultiLine(2),
	3: lineClampMultiLine(3),
	4: lineClampMultiLine(4),
	5: lineClampMultiLine(5),
};

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

function fontSizeStep(size: FontSizeStep) {
	return { fontSize: size, letterSpacing: size, lineHeight: size };
}

const sizeVariants = {
	'100': fontSizeStep('100'),
	'200': fontSizeStep('200'),
	'300': fontSizeStep('300'),
	'400': fontSizeStep('400'),
	'500': fontSizeStep('500'),
	'600': fontSizeStep('600'),
	'700': fontSizeStep('700'),
	'800': fontSizeStep('800'),
	'900': fontSizeStep('900'),
} satisfies Record<FontSizeStep, object>;

const fontVariantNumericVariants = {
	'diagonal-fractions': { fontVariantNumeric: 'diagonal-fractions' },
	ordinal: { fontVariantNumeric: 'ordinal' },
	'slashed-zero': { fontVariantNumeric: 'slashed-zero' },
	'tabular-nums': { fontVariantNumeric: 'tabular-nums' },
	unset: { fontVariantNumeric: 'normal' },
};

const textAlignVariants = {
	center: { textAlign: 'center' },
	end: { textAlign: 'end' },
	start: { textAlign: 'start' },
};

const textDecorationVariants = {
	inherit: { textDecoration: 'inherit' },
	'line-through': { textDecoration: 'line-through' },
	none: { textDecoration: 'none' },
	underline: { textDecoration: 'underline' },
};

const textTransformVariants = {
	capitalize: { textTransform: 'capitalize' },
	inherit: { textTransform: 'inherit' },
	lowercase: { textTransform: 'lowercase' },
	none: { textTransform: 'none' },
	uppercase: { textTransform: 'uppercase' },
};

const textWrapVariants = {
	balance: { textWrap: 'balance' },
	pretty: { textWrap: 'pretty' },
	unset: {},
};

const fontWeightVariants = {
	body: { fontWeight: 'body' },
	emphasis: { fontWeight: 'emphasis' },
	heading: { fontWeight: 'heading' },
	label: { fontWeight: 'label' },
};

const colorVariants = {
	accent: { color: 'intent.accent.text' },
	danger: { color: 'intent.danger.text' },
	info: { color: 'intent.info.text' },
	primary: { color: 'text.primary' },
	secondary: { color: 'text.secondary' },
	success: { color: 'intent.success.text' },
	warning: { color: 'intent.warning.text' },
};

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
		fontVariantNumeric: fontVariantNumericVariants,
		isVisuallyHidden: { false: {}, true: { position: 'absolute', transform: 'scale(0)' } },
		lineClamp: textLineClampVariants,
		shouldDisableTrim: { false: {}, true: {} },
		size: sizeVariants,
		textAlign: textAlignVariants,
		textDecoration: textDecorationVariants,
		textTransform: textTransformVariants,
		textWrap: textWrapVariants,
		fontWeight: fontWeightVariants,
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

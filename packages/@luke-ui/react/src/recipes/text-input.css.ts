import type { RecipeVariants } from '@vanilla-extract/recipes';
import { recipeInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';
import { descendantDisabledSelector, inputStates } from './input-states.css.js';

// The well's own selector composition. Mirrors the "defaults" shape that
// `input-states.css.ts` also composes internally, but stays independent of
// its old-token style values: `Combobox` has not migrated to the new
// semantic contract yet (see the linked "Migrate Combobox" issue), and this
// slice must not change its rendered output.
const notDisabled = `:not(:where(${inputStates.disabled}))`;
const disabled = `&:where(${inputStates.disabled})`;
const focusWithin = `&:where(${inputStates.focusWithin})${notDisabled}`;
const hover = `&:where(${inputStates.hover})${notDisabled}:not(:where(${inputStates.focusWithin})):not(:where(${inputStates.readOnly}))`;
const invalid = `&:where(${inputStates.invalid})${notDisabled}`;
const invalidFocusWithin = `&:where(${inputStates.invalid}):where(${inputStates.focusWithin})${notDisabled}`;
const readOnly = `&:where(${inputStates.readOnly})${notDisabled}`;
const readOnlyFocusWithin = `&:where(${inputStates.readOnly}):where(${inputStates.focusWithin})${notDisabled}`;

const focusRing = {
	outlineColor: vars.color.border.focus,
	outlineOffset: '2px',
	outlineStyle: 'solid',
	outlineWidth: '2px',
} as const;

/** Vanilla-extract recipe for the `TextInput` group's tactile well chrome. */
export const textInputGroup = recipeInLayer('recipes', {
	base: {
		'@media': {
			'(forced-colors: active)': {
				backgroundColor: 'Field',
				borderColor: 'FieldText',
				boxShadow: 'none',
				color: 'FieldText',
				forcedColorAdjust: 'auto',
				selectors: {
					[disabled]: {
						borderColor: 'GrayText',
						color: 'GrayText',
						opacity: 1,
					},
					[focusWithin]: {
						outlineColor: 'Highlight',
					},
					[invalidFocusWithin]: {
						outlineColor: 'Highlight',
					},
				},
			},
		},
		alignItems: 'center',
		backgroundColor: vars.color.surface.recessed,
		borderColor: vars.color.border.control,
		borderRadius: vars.radius.control,
		borderStyle: 'solid',
		borderWidth: '1px',
		boxShadow: vars.depth.recessed,
		cursor: 'text',
		display: 'inline-flex',
		fontFamily: vars.font.family,
		inlineSize: '100%',
		isolation: 'isolate',
		letterSpacing: vars.font[300].letterSpacing,
		lineHeight: vars.font[300].lineHeight,
		minInlineSize: 0,
		outlineColor: 'transparent',
		outlineOffset: 0,
		outlineStyle: 'solid',
		outlineWidth: '2px',
		overflow: 'visible',
		transitionDuration: vars.motion.duration.fast,
		transitionProperty: 'background-color, border-color, color',
		transitionTimingFunction: vars.motion.easing.standard,

		selectors: {
			[disabled]: {
				cursor: 'not-allowed',
				opacity: 0.55,
			},
			[focusWithin]: {
				borderColor: vars.color.intent.accent.border,
				...focusRing,
			},
			[hover]: {
				borderColor: vars.color.intent.accent.border,
			},
			[invalid]: {
				borderColor: vars.color.intent.danger.border,
			},
			[invalidFocusWithin]: {
				borderColor: vars.color.intent.danger.border,
				...focusRing,
			},
			[readOnly]: {
				backgroundColor: vars.color.surface.canvas,
				borderColor: vars.color.border.decorative,
			},
			[readOnlyFocusWithin]: {
				...focusRing,
			},
		},
	},
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		size: {
			medium: {
				blockSize: vars.controlSize.medium,
				fontSize: vars.font[300].fontSize,
			},
			small: {
				blockSize: vars.controlSize.small,
				fontSize: vars.font[200].fontSize,
				letterSpacing: vars.font[200].letterSpacing,
				lineHeight: vars.font[200].lineHeight,
			},
		},
	},
});

/** Vanilla-extract recipe for the `TextInput` control styles. */
export const textInputControl = recipeInLayer('recipes', {
	base: {
		appearance: 'none',
		backgroundColor: 'transparent',
		borderColor: 'transparent',
		borderStyle: 'none',
		borderWidth: 0,
		color: vars.color.text.primary,
		cursor: 'text',
		flex: 1,
		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontWeight: 'inherit',
		inlineSize: '100%',
		letterSpacing: 'inherit',
		lineHeight: 'inherit',
		minInlineSize: 0,
		outlineColor: 'transparent',
		outlineStyle: 'none',
		outlineWidth: 0,
		paddingBlockEnd: 0,
		paddingBlockStart: 0,

		selectors: {
			'&::placeholder': {
				color: vars.color.text.secondary,
				opacity: 1,
			},
			'&:where([data-disabled="true"], :disabled)': {
				color: vars.color.textDisabled,
				cursor: 'not-allowed',
			},
		},
	},
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		size: {
			medium: {
				blockSize: vars.controlSize.medium,
				paddingInlineEnd: vars.space[300],
				paddingInlineStart: vars.space[300],
			},
			small: {
				blockSize: vars.controlSize.small,
				paddingInlineEnd: vars.space[200],
				paddingInlineStart: vars.space[200],
			},
		},
	},
});

/** Vanilla-extract recipe for the `TextInput` start-adornment styles. */
export const textInputAdornmentStart = recipeInLayer('recipes', {
	base: {
		alignItems: 'center',
		borderInlineEndColor: vars.color.border.control,
		borderInlineEndStyle: 'solid',
		borderInlineEndWidth: '1px',
		color: vars.color.text.secondary,
		display: 'inline-flex',
		flexShrink: 0,
		lineHeight: 'inherit',

		selectors: {
			[descendantDisabledSelector]: {
				color: vars.color.textDisabled,
			},
		},
	},
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		size: {
			medium: {
				paddingInlineEnd: vars.space[300],
				paddingInlineStart: vars.space[300],
			},
			small: {
				paddingInlineEnd: vars.space[200],
				paddingInlineStart: vars.space[200],
			},
		},
	},
});

/** Vanilla-extract recipe for the `TextInput` end-adornment styles. */
export const textInputAdornmentEnd = recipeInLayer('recipes', {
	base: {
		alignItems: 'center',
		borderInlineStartColor: vars.color.border.control,
		borderInlineStartStyle: 'solid',
		borderInlineStartWidth: '1px',
		color: vars.color.text.secondary,
		display: 'inline-flex',
		flexShrink: 0,
		lineHeight: 'inherit',

		selectors: {
			[descendantDisabledSelector]: {
				color: vars.color.textDisabled,
			},
		},
	},
	defaultVariants: {
		size: 'medium',
	},
	variants: {
		size: {
			medium: {
				paddingInlineEnd: vars.space[300],
				paddingInlineStart: vars.space[300],
			},
			small: {
				paddingInlineEnd: vars.space[200],
				paddingInlineStart: vars.space[200],
			},
		},
	},
});

/** Variant type for the `TextInput` recipe. */
export type TextInputVariants = RecipeVariants<typeof textInputGroup>;

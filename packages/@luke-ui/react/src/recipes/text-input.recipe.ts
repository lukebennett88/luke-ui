import { defineSlotRecipe } from '@pandacss/dev';

/** Tactile well chrome and private parts for TextInput. */
export const textInputRecipe = defineSlotRecipe({
	className: 'text-input',
	description: 'Tactile well chrome and private parts for TextInput.',
	slots: ['group', 'control', 'adornmentStart', 'adornmentEnd'],
	base: {
		group: {
			'@media (forced-colors: active)': {
				backgroundColor: 'Field',
				borderColor: 'FieldText',
				boxShadow: 'none',
				color: 'FieldText',
				forcedColorAdjust: 'auto',
				'&:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))':
					{
						borderColor: 'GrayText',
						color: 'GrayText',
						opacity: 1,
					},
				'&:where([data-focus-within="true"], :focus-within):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"])))':
					{
						outlineColor: 'Highlight',
					},
				'&:where([data-invalid="true"], [aria-invalid="true"], :has(:invalid), :has(input[aria-invalid="true"])):where([data-focus-within="true"], :focus-within):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"])))':
					{
						outlineColor: 'Highlight',
					},
			},
			alignItems: 'center',
			backgroundColor: 'surface.recessed',
			borderColor: 'border.control',
			borderRadius: 'control',
			borderStyle: 'solid',
			borderWidth: '1px',
			boxShadow: 'recessed',
			cursor: 'text',
			display: 'inline-flex',
			fontFamily: 'var(--luke-font-family)',
			inlineSize: '100%',
			isolation: 'isolate',
			letterSpacing: 'var(--luke-font-300-letter-spacing)',
			lineHeight: 'var(--luke-font-300-line-height)',
			minInlineSize: 0,
			outlineColor: 'transparent',
			outlineOffset: 0,
			outlineStyle: 'solid',
			outlineWidth: '2px',
			overflow: 'visible',
			transitionDuration: 'fast',
			transitionProperty: 'background-color, border-color, color',
			transitionTimingFunction: 'standard',
			'&:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))':
				{
					cursor: 'not-allowed',
					opacity: 0.55,
				},
			'&:where([data-focus-within="true"], :focus-within):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"])))':
				{
					borderColor: 'intent.accent.border',
					outlineColor: '{colors.border.focus}',
					outlineOffset: '2px',
					outlineStyle: 'solid',
					outlineWidth: '2px',
				},
			'&:where([data-hovered="true"], :hover):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-focus-within="true"], :focus-within)):not(:where([data-readonly="true"], :has(input:read-only)))':
				{
					borderColor: 'intent.accent.border',
				},
			'&:where([data-invalid="true"], [aria-invalid="true"], :has(:invalid), :has(input[aria-invalid="true"])):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"])))':
				{
					borderColor: 'intent.danger.border',
				},
			'&:where([data-invalid="true"], [aria-invalid="true"], :has(:invalid), :has(input[aria-invalid="true"])):where([data-focus-within="true"], :focus-within):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"])))':
				{
					borderColor: 'intent.danger.border',
					outlineColor: '{colors.border.focus}',
					outlineOffset: '2px',
					outlineStyle: 'solid',
					outlineWidth: '2px',
				},
			'&:where([data-readonly="true"], :has(input:read-only)):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"])))':
				{
					backgroundColor: 'surface.canvas',
					borderColor: 'border.decorative',
					boxShadow: 'none',
				},
			'&:where([data-readonly="true"], :has(input:read-only)):where([data-focus-within="true"], :focus-within):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"])))':
				{
					outlineColor: '{colors.border.focus}',
					outlineOffset: '2px',
					outlineStyle: 'solid',
					outlineWidth: '2px',
				},
		},
		control: {
			appearance: 'none',
			backgroundColor: 'transparent',
			borderColor: 'transparent',
			borderStyle: 'none',
			borderWidth: 0,
			color: 'text.primary',
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
			'&::placeholder': { color: 'text.secondary', opacity: 1 },
			'&:where([data-disabled="true"], :disabled)': {
				color: 'textDisabled',
				cursor: 'not-allowed',
			},
		},
		adornmentStart: {
			alignItems: 'center',
			borderInlineEndColor: 'border.control',
			borderInlineEndStyle: 'solid',
			borderInlineEndWidth: '1px',
			color: 'text.secondary',
			display: 'inline-flex',
			flexShrink: 0,
			':where([data-disabled="true"], [aria-disabled="true"]) &': { color: 'textDisabled' },
		},
		adornmentEnd: {
			alignItems: 'center',
			borderInlineStartColor: 'border.control',
			borderInlineStartStyle: 'solid',
			borderInlineStartWidth: '1px',
			color: 'text.secondary',
			display: 'inline-flex',
			flexShrink: 0,
			':where([data-disabled="true"], [aria-disabled="true"]) &': { color: 'textDisabled' },
		},
	},
	defaultVariants: { size: 'medium' },
	variants: {
		size: {
			medium: {
				group: { blockSize: 'controlSize.medium', fontSize: 'var(--luke-font-300-font-size)' },
				control: {
					blockSize: 'controlSize.medium',
					paddingInlineEnd: '300',
					paddingInlineStart: '300',
				},
				adornmentStart: {
					lineHeight: 'var(--luke-font-300-line-height)',
					paddingInlineEnd: '300',
					paddingInlineStart: '300',
				},
				adornmentEnd: {
					lineHeight: 'var(--luke-font-300-line-height)',
					paddingInlineEnd: '300',
					paddingInlineStart: '300',
				},
			},
			small: {
				group: {
					blockSize: 'controlSize.small',
					fontSize: 'var(--luke-font-200-font-size)',
					letterSpacing: 'var(--luke-font-200-letter-spacing)',
					lineHeight: 'var(--luke-font-200-line-height)',
				},
				control: {
					blockSize: 'controlSize.small',
					paddingInlineEnd: '200',
					paddingInlineStart: '200',
				},
				adornmentStart: {
					lineHeight: 'var(--luke-font-200-line-height)',
					paddingInlineEnd: '200',
					paddingInlineStart: '200',
				},
				adornmentEnd: {
					lineHeight: 'var(--luke-font-200-line-height)',
					paddingInlineEnd: '200',
					paddingInlineStart: '200',
				},
			},
		},
	},
});

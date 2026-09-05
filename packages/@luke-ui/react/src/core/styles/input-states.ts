import type { CompiledStyles } from '@stylexjs/stylex';
import * as stylex from '@stylexjs/stylex';
import { vars } from '../../theme/tokens.stylex.js';

/* Keep selector keys local because StyleX cannot substitute imported consts in packed output. */
/* Scope native `:invalid` and `:read-only` to inputs so untouched or non-input descendants do not
 * receive field state styles. Combobox also limits focus styles to its text input because its group
 * contains a trigger and clear button. */
const disabled =
	'[data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"])';
const hovered = '[data-hovered="true"], :hover';
const focusWithin = '[data-focus-within="true"], :focus-within';
const invalid = '[data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])';
const readOnly = '[data-readonly="true"], :has(input:read-only)';

const notDisabled = `:not(:where(${disabled}))`;
const notInvalid = `:not(:where(${invalid}))`;
const notReadOnly = `:not(:where(${readOnly}))`;

/** Combobox narrows every focus-within condition to the text input; InputGroup does not. */
const comboboxFocusWithin = `:where(${focusWithin}):has(input:focus)`;
const inputGroupFocusWithin = `:where(${focusWithin})`;

const shared = stylex.create({
	/** Disabled and hover are identical for both consumers: neither depends on focus-within. */
	base: {
		[`:where(${disabled})`]: {
			cursor: 'not-allowed',
			opacity: vars.interaction.disabledOpacity,
		},
		[`:where(${hovered})${notDisabled}:not(:where(${focusWithin}))${notReadOnly}${notInvalid}`]: {
			borderColor: vars.color.border.accent,
		},
		'@media (forced-colors: active)': {
			backgroundColor: 'Field',
			borderColor: 'FieldText',
			boxShadow: 'none',
			color: 'FieldText',
			forcedColorAdjust: 'auto',
			[`:where(${disabled})`]: {
				borderColor: 'GrayText',
				color: 'GrayText',
				opacity: 1,
			},
		},
	},
});

const combobox = stylex.create({
	forcedColorsHover: {
		'@media (forced-colors: active)': {
			[`:where(${hovered})${notDisabled}:not(:where(${focusWithin}))${notReadOnly}${notInvalid}`]: {
				borderColor: 'FieldText',
			},
		},
	},
	focusWithin: {
		[`${comboboxFocusWithin}${notDisabled}${notInvalid}${notReadOnly}`]: {
			borderColor: vars.color.border.accent,
			outlineColor: vars.color.border.focus,
			outlineOffset: '2px',
			outlineStyle: 'solid',
			outlineWidth: '2px',
		},
		'@media (forced-colors: active)': {
			[`${comboboxFocusWithin}${notDisabled}${notInvalid}${notReadOnly}`]: {
				borderColor: 'FieldText',
				outlineColor: 'Highlight',
			},
		},
	},
	invalid: {
		[`:where(${invalid})${notDisabled}:not(${comboboxFocusWithin})${notReadOnly}`]: {
			borderColor: vars.color.background.danger.solid.rest,
		},
		[`:where(${invalid}):where(${focusWithin}):has(input:focus)${notDisabled}${notReadOnly}`]: {
			borderColor: vars.color.background.danger.solid.rest,
			outlineColor: vars.color.border.focus,
			outlineOffset: '2px',
			outlineStyle: 'solid',
			outlineWidth: '2px',
		},
		'@media (forced-colors: active)': {
			[`:where(${invalid})${notDisabled}:not(${comboboxFocusWithin})${notReadOnly}`]: {
				borderColor: 'FieldText',
			},
			[`:where(${invalid}):where(${focusWithin}):has(input:focus)${notDisabled}${notReadOnly}`]: {
				borderColor: 'FieldText',
				outlineColor: 'Highlight',
			},
		},
	},
	readOnly: {
		[`:where(${readOnly})${notDisabled}:not(${comboboxFocusWithin})`]: {
			backgroundColor: vars.color.surface.canvas,
			borderColor: vars.color.border.decorative,
			boxShadow: 'none',
		},
		[`:where(${readOnly}):where(${focusWithin}):has(input:focus)${notDisabled}`]: {
			backgroundColor: vars.color.surface.canvas,
			borderColor: vars.color.border.decorative,
			boxShadow: 'none',
			outlineColor: vars.color.border.focus,
			outlineOffset: '2px',
			outlineStyle: 'solid',
			outlineWidth: '2px',
		},
		'@media (forced-colors: active)': {
			[`:where(${readOnly})${notDisabled}:not(${comboboxFocusWithin})`]: {
				backgroundColor: 'Field',
				borderColor: 'FieldText',
			},
			[`:where(${readOnly}):where(${focusWithin}):has(input:focus)${notDisabled}`]: {
				backgroundColor: 'Field',
				borderColor: 'FieldText',
				outlineColor: 'Highlight',
			},
		},
	},
});

const inputGroup = stylex.create({
	focusWithin: {
		[`${inputGroupFocusWithin}${notDisabled}${notInvalid}${notReadOnly}`]: {
			borderColor: vars.color.border.accent,
			outlineColor: vars.color.border.focus,
			outlineOffset: '2px',
			outlineStyle: 'solid',
			outlineWidth: '2px',
		},
		'@media (forced-colors: active)': {
			[`${inputGroupFocusWithin}${notDisabled}`]: {
				outlineColor: 'Highlight',
			},
		},
	},
	invalid: {
		[`:where(${invalid})${notDisabled}:not(${inputGroupFocusWithin})${notReadOnly}`]: {
			borderColor: vars.color.background.danger.solid.rest,
		},
		[`:where(${invalid}):where(${focusWithin})${notDisabled}${notReadOnly}`]: {
			borderColor: vars.color.background.danger.solid.rest,
			outlineColor: vars.color.border.focus,
			outlineOffset: '2px',
			outlineStyle: 'solid',
			outlineWidth: '2px',
		},
	},
	readOnly: {
		[`:where(${readOnly})${notDisabled}:not(${inputGroupFocusWithin})`]: {
			backgroundColor: vars.color.surface.canvas,
			borderColor: vars.color.border.decorative,
			boxShadow: 'none',
		},
		[`:where(${readOnly}):where(${focusWithin})${notDisabled}`]: {
			backgroundColor: vars.color.surface.canvas,
			borderColor: vars.color.border.decorative,
			boxShadow: 'none',
			outlineColor: vars.color.border.focus,
			outlineOffset: '2px',
			outlineStyle: 'solid',
			outlineWidth: '2px',
		},
	},
});

/**
 * The field-control state styles for `Combobox`'s in-control surface. Compose into a slot's style
 * array alongside any local additions — Combobox also paints an in-control invalid `::after` icon,
 * which stays local because it is Combobox's own anatomy, not a shared state.
 */
export const comboboxInputStates: ReadonlyArray<CompiledStyles> = [
	shared.base,
	combobox.forcedColorsHover,
	combobox.focusWithin,
	combobox.invalid,
	combobox.readOnly,
];

/** The field-control state styles for `InputGroup`'s group surface. */
export const inputGroupInputStates: ReadonlyArray<CompiledStyles> = [
	shared.base,
	inputGroup.focusWithin,
	inputGroup.invalid,
	inputGroup.readOnly,
];

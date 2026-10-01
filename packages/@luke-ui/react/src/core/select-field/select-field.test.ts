import { assertType, test } from 'vite-plus/test';
import type { SelectFieldProps } from './select-field.js';

test('SelectField requires a visible label or an accessible name', () => {
	// @ts-expect-error — a field without a label requires aria-label or aria-labelledby
	assertType<SelectFieldProps<object>>({ children: [], name: 'theme' });
	assertType<SelectFieldProps<object>>({ children: [], label: 'Theme', name: 'theme' });
	assertType<SelectFieldProps<object>>({ 'aria-label': 'Theme', children: [], name: 'theme' });
	assertType<SelectFieldProps<object>>({
		'aria-labelledby': 'theme-heading',
		children: [],
		name: 'theme',
	});
	// @ts-expect-error — aria-label and aria-labelledby are mutually exclusive
	assertType<SelectFieldProps<object>>({
		'aria-label': 'Theme',
		'aria-labelledby': 'theme-heading',
		children: [],
		name: 'theme',
	});
	// @ts-expect-error — a visible label and aria-label are mutually exclusive
	assertType<SelectFieldProps<object>>({
		'aria-label': 'Theme',
		children: [],
		label: 'Theme',
		name: 'theme',
	});
});

test('SelectField derives invalid state from errorMessage only', () => {
	// @ts-expect-error — a non-empty errorMessage is the only way to mark the field invalid
	assertType<SelectFieldProps<object>>({ children: [], isInvalid: true, label: 'Theme' });
});

test('SelectField has no read-only or pending state', () => {
	// @ts-expect-error — React Aria's Select has no read-only state
	assertType<SelectFieldProps<object>>({ children: [], isReadOnly: true, label: 'Theme' });
	// @ts-expect-error — a pending save uses isDisabled or lets later changes through
	assertType<SelectFieldProps<object>>({ children: [], isPending: true, label: 'Theme' });
});

test('SelectField has no popover, menu width, or listbox props', () => {
	// @ts-expect-error — the popover takes no props through the field
	assertType<SelectFieldProps<object>>({ children: [], label: 'Theme', popoverProps: {} });
	// @ts-expect-error — the popover is as wide as the trigger
	assertType<SelectFieldProps<object>>({ children: [], label: 'Theme', menuWidth: 100 });
	// @ts-expect-error — the listbox takes no props through the field
	assertType<SelectFieldProps<object>>({ children: [], label: 'Theme', listBoxProps: {} });
});

test('SelectField selection props speak Key | null', () => {
	assertType<SelectFieldProps<object>>({
		children: [],
		defaultValue: 'system',
		label: 'Theme',
		onChange: (value: string | number | null) => value,
		value: null,
	});
});

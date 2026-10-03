import type { Ref } from 'react';
import { assertType, test } from 'vite-plus/test';
import type { SelectRootProps, SelectTriggerProps } from '../primitives/select/select.js';
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

test('SelectField does not accept isInvalid', () => {
	// @ts-expect-error — SelectField exposes no `isInvalid` prop
	assertType<SelectFieldProps<object>>({ children: [], isInvalid: true, label: 'Theme' });
});

test('SelectField has no read-only state and accepts isPending', () => {
	// @ts-expect-error — React Aria's Select has no read-only state
	assertType<SelectFieldProps<object>>({ children: [], isReadOnly: true, label: 'Theme' });
	assertType<SelectFieldProps<object>>({ children: [], isPending: true, label: 'Theme' });
});

test('isPending belongs to the trigger, not the select root', () => {
	// @ts-expect-error — a pending state sits on the trigger, so the root takes no `isPending`
	assertType<SelectRootProps>({ isPending: true });
	assertType<SelectTriggerProps>({ children: null, isPending: true });
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

test('SelectField takes a root element ref and a trigger ref', () => {
	assertType<SelectFieldProps<object>>({
		children: [],
		label: 'Theme',
		ref: null as unknown as Ref<HTMLDivElement>,
		triggerRef: null as unknown as Ref<HTMLButtonElement>,
	});
	assertType<SelectFieldProps<object>>({
		children: [],
		label: 'Theme',
		ref: () => {},
		triggerRef: () => {},
	});
});

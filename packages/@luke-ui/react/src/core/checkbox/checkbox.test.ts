import type { Ref } from 'react';
import { assertType, test } from 'vite-plus/test';
import type { CheckboxProps } from './checkbox.js';

test('Checkbox requires a visible label or an accessible name', () => {
	// @ts-expect-error — a checkbox without a label requires aria-label or aria-labelledby
	assertType<CheckboxProps>({ name: 'terms' });
	assertType<CheckboxProps>({ label: 'Terms', name: 'terms' });
	assertType<CheckboxProps>({ 'aria-label': 'Select row', name: 'row' });
	assertType<CheckboxProps>({ 'aria-labelledby': 'row-heading', name: 'row' });
	// @ts-expect-error — aria-label and aria-labelledby are mutually exclusive
	assertType<CheckboxProps>({
		'aria-label': 'Select row',
		'aria-labelledby': 'row-heading',
		name: 'row',
	});
	// @ts-expect-error — a visible label and aria-label are mutually exclusive
	assertType<CheckboxProps>({ 'aria-label': 'Terms', label: 'Terms', name: 'terms' });
	// @ts-expect-error — a visible label and aria-labelledby are mutually exclusive
	assertType<CheckboxProps>({ 'aria-labelledby': 'heading', label: 'Terms', name: 'terms' });
});

test('Checkbox takes its label from the label prop, not children', () => {
	// @ts-expect-error — children are no longer the label
	assertType<CheckboxProps>({ children: 'Terms', label: 'Terms' });
});

test('Checkbox does not accept isInvalid', () => {
	// @ts-expect-error — Checkbox exposes no isInvalid prop
	assertType<CheckboxProps>({ isInvalid: true, label: 'Terms' });
});

test('Checkbox takes a plain ref for its root and an inputRef for its input', () => {
	assertType<CheckboxProps>({ label: 'Terms', ref: {} as Ref<HTMLDivElement> });
	assertType<CheckboxProps>({ inputRef: {} as Ref<HTMLInputElement>, label: 'Terms' });
	assertType<CheckboxProps>({ inputRef: () => {}, label: 'Terms', ref: () => {} });
});

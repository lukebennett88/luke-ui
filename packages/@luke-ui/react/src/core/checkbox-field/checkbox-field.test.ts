import type { Ref } from 'react';
import { assertType, expectTypeOf, test } from 'vite-plus/test';
import type { CheckboxFieldProps } from './checkbox-field.js';

test('CheckboxField requires a visible label', () => {
	// @ts-expect-error — a composed checkbox always has a visible label
	assertType<CheckboxFieldProps>({ name: 'terms' });
	assertType<CheckboxFieldProps>({ label: 'Terms', name: 'terms' });
});

test('CheckboxField rejects external accessible names', () => {
	// @ts-expect-error — use the Checkbox primitive for an externally named checkbox
	assertType<CheckboxFieldProps>({ 'aria-label': 'Select row', label: 'Terms' });
	// @ts-expect-error — use the Checkbox primitive for an externally named checkbox
	assertType<CheckboxFieldProps>({ 'aria-labelledby': 'row-heading', label: 'Terms' });
});

test('CheckboxField does not take a collection slot', () => {
	// @ts-expect-error — a collection that names the checkbox needs the Checkbox primitive
	assertType<CheckboxFieldProps>({ label: 'Terms', slot: 'selection' });
});

test('CheckboxField takes its label from the label prop, not children', () => {
	// @ts-expect-error — children are not the label
	assertType<CheckboxFieldProps>({ children: 'Terms', label: 'Terms' });
});

test('CheckboxField does not accept isInvalid', () => {
	// @ts-expect-error — a non-empty errorMessage marks the checkbox invalid
	assertType<CheckboxFieldProps>({ isInvalid: true, label: 'Terms' });
});

test('CheckboxField takes a plain ref for its root and an inputRef for its input', () => {
	expectTypeOf<CheckboxFieldProps['ref']>().toEqualTypeOf<Ref<HTMLDivElement> | undefined>();
	expectTypeOf<CheckboxFieldProps['inputRef']>().toEqualTypeOf<Ref<HTMLInputElement> | undefined>();
	assertType<CheckboxFieldProps>({ inputRef: () => {}, label: 'Terms', ref: () => {} });
});

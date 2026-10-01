import type { Ref } from 'react';
import { assertType, test } from 'vite-plus/test';
import type { TextInputFieldProps } from './text-input-field.js';

test('TextInputField requires a visible label or an accessible name', () => {
	// @ts-expect-error — a field without a label requires aria-label or aria-labelledby
	assertType<TextInputFieldProps>({ name: 'search' });
	assertType<TextInputFieldProps>({ label: 'Search', name: 'search' });
	assertType<TextInputFieldProps>({ 'aria-label': 'Search', name: 'search' });
	assertType<TextInputFieldProps>({ 'aria-labelledby': 'search-heading', name: 'search' });
	// @ts-expect-error — aria-label and aria-labelledby are mutually exclusive
	assertType<TextInputFieldProps>({
		'aria-label': 'Search',
		'aria-labelledby': 'search-heading',
		name: 'search',
	});
	// @ts-expect-error — a visible label and aria-label are mutually exclusive
	assertType<TextInputFieldProps>({ 'aria-label': 'Search', label: 'Search', name: 'search' });
});

test('TextInputField derives invalid state from errorMessage only', () => {
	// @ts-expect-error — a non-empty errorMessage is the only way to mark the field invalid
	assertType<TextInputFieldProps>({ isInvalid: true, label: 'Search' });
});

test('TextInputField takes a root element ref and an input ref', () => {
	assertType<TextInputFieldProps>({
		inputRef: null as unknown as Ref<HTMLInputElement>,
		label: 'Search',
		ref: null as unknown as Ref<HTMLDivElement>,
	});
});

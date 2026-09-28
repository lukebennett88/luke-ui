import { assertType, test } from 'vite-plus/test';
import type { TextFieldProps } from './text-field.js';

test('TextField requires a visible label or an accessible name', () => {
	// @ts-expect-error — a field without a label requires aria-label or aria-labelledby
	assertType<TextFieldProps>({ name: 'search' });
	assertType<TextFieldProps>({ label: 'Search', name: 'search' });
	assertType<TextFieldProps>({ 'aria-label': 'Search', name: 'search' });
	assertType<TextFieldProps>({ 'aria-labelledby': 'search-heading', name: 'search' });
	// @ts-expect-error — aria-label and aria-labelledby are mutually exclusive
	assertType<TextFieldProps>({
		'aria-label': 'Search',
		'aria-labelledby': 'search-heading',
		name: 'search',
	});
	// @ts-expect-error — a visible label and aria-label are mutually exclusive
	assertType<TextFieldProps>({ 'aria-label': 'Search', label: 'Search', name: 'search' });
});

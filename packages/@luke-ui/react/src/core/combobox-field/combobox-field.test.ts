import type { Ref } from 'react';
import { assertType, test } from 'vite-plus/test';
import type { ComboboxFieldProps } from './combobox-field.js';

type Item = { id: string; label: string };

test('ComboboxField requires a visible label or an accessible name', () => {
	// @ts-expect-error — a field without a label requires aria-label or aria-labelledby
	assertType<ComboboxFieldProps<Item>>({ children: () => null });
	assertType<ComboboxFieldProps<Item>>({ children: () => null, label: 'Country' });
	assertType<ComboboxFieldProps<Item>>({
		'aria-label': 'Country',
		children: () => null,
	});
	assertType<ComboboxFieldProps<Item>>({
		'aria-labelledby': 'country-heading',
		children: () => null,
	});
	// @ts-expect-error — aria-label and aria-labelledby are mutually exclusive
	assertType<ComboboxFieldProps<Item>>({
		'aria-label': 'Country',
		'aria-labelledby': 'country-heading',
		children: () => null,
	});
	// @ts-expect-error — a visible label and aria-label are mutually exclusive
	assertType<ComboboxFieldProps<Item>>({
		'aria-label': 'Country',
		children: () => null,
		label: 'Country',
	});
});

test('ComboboxField takes a root element ref and an input ref', () => {
	assertType<ComboboxFieldProps<Item>>({
		children: () => null,
		inputRef: null as unknown as Ref<HTMLInputElement>,
		label: 'Country',
		ref: null as unknown as Ref<HTMLDivElement>,
	});
});

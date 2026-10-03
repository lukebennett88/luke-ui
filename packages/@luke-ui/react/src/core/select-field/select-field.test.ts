import { createElement } from 'react';
import type { Ref } from 'react';
import type { Key } from 'react-aria-components/Select';
import { assertType, expectTypeOf, test } from 'vite-plus/test';
import type { SelectRootProps, SelectTriggerProps } from '../primitives/select/select.js';
import { SelectItem } from '../primitives/select/select.js';
import type { SelectFieldProps } from './select-field.js';
import { SelectField } from './select-field.js';

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

test('SelectField has no open-state props', () => {
	// @ts-expect-error — the field owns the popover's open state
	assertType<SelectFieldProps<object>>({ children: [], isOpen: true, label: 'Theme' });
	// @ts-expect-error — the field owns the popover's open state
	assertType<SelectFieldProps<object>>({ children: [], defaultOpen: true, label: 'Theme' });
	// @ts-expect-error — the field owns the popover's open state
	assertType<SelectFieldProps<object>>({ children: [], label: 'Theme', onOpenChange: () => {} });
	assertType<SelectRootProps>({ defaultOpen: true, isOpen: true, onOpenChange: () => {} });
});

test('SelectField has no allowsEmptyCollection, disabledKeys, or slot', () => {
	assertType<SelectFieldProps<object>>({ children: [], label: 'Theme' });
	assertType<SelectFieldProps<object>>({
		// @ts-expect-error — SelectField does not expose allowsEmptyCollection
		allowsEmptyCollection: true,
		children: [],
		label: 'Theme',
	});
	assertType<SelectFieldProps<object>>({
		children: [],
		// @ts-expect-error — SelectField does not expose disabledKeys
		disabledKeys: ['small'],
		label: 'Theme',
	});
	assertType<SelectFieldProps<object>>({
		children: [],
		label: 'Theme',
		// @ts-expect-error — SelectField does not expose slot
		slot: 'example',
	});
});

// SelectField is called directly in these tests so that TypeScript infers `T` the same way it does
// for JSX. Nothing renders, and the render functions never run.

const countries = [
	{ code: 'au', name: 'Australia' },
	{ code: 'nz', name: 'New Zealand' },
];

const sizes = [
	{ id: 'small', label: 'Small' },
	{ id: 'large', label: 'Large' },
];

const literalSizes = [
	{ id: 'small', label: 'Small' },
	{ id: 'large', label: 'Large' },
] as const;

const numberedSizes = [
	{ id: 1, label: 'Small' },
	{ id: 2, label: 'Large' },
];

test('SelectField infers the item type from items', () => {
	SelectField({
		children: (country) => {
			expectTypeOf(country).toEqualTypeOf<{ code: string; name: string }>();
			return null;
		},
		items: countries,
		label: 'Country',
	});
	SelectField({
		children: (size) => {
			expectTypeOf(size).toEqualTypeOf<{ id: string; label: string }>();
			return null;
		},
		items: sizes,
		label: 'Size',
	});
});

test('SelectField infers the key type from the id of each item', () => {
	SelectField({
		children: () => null,
		items: sizes,
		label: 'Size',
		onChange: (value) => {
			expectTypeOf(value).toEqualTypeOf<string | null>();
		},
	});
	SelectField({
		children: () => null,
		items: numberedSizes,
		label: 'Size',
		onChange: (value) => {
			expectTypeOf(value).toEqualTypeOf<number | null>();
		},
	});
});

test('SelectField infers literal keys from as const data', () => {
	SelectField({
		children: () => null,
		items: literalSizes,
		label: 'Size',
		onChange: (value) => {
			expectTypeOf(value).toEqualTypeOf<'large' | 'small' | null>();
		},
	});
});

test('SelectField infers the key type from the key of each item', () => {
	const keyed = [
		{ key: 'a', title: 'A' },
		{ key: 'b', title: 'B' },
	];
	SelectField({
		children: (item) => {
			expectTypeOf(item).toEqualTypeOf<{ key: string; title: string }>();
			return null;
		},
		items: keyed,
		label: 'Letter',
		onChange: (value) => {
			expectTypeOf(value).toEqualTypeOf<string | null>();
		},
	});
});

test('SelectField prefers the key of an item over its id', () => {
	const both = [{ id: 1, key: 'one' }];
	SelectField({
		children: () => null,
		items: both,
		label: 'Number',
		onChange: (value) => {
			expectTypeOf(value).toEqualTypeOf<string | null>();
		},
	});
});

test('SelectField takes the union of keys across a union of item types', () => {
	const mixed: Array<{ id: string } | { key: number }> = [];
	SelectField({
		children: () => null,
		items: mixed,
		label: 'Mixed',
		onChange: (value) => {
			expectTypeOf(value).toEqualTypeOf<number | string | null>();
		},
	});
});

test('SelectField keys fall back to Key when the items have no id or key', () => {
	SelectField({
		children: (country) => {
			expectTypeOf(country).toEqualTypeOf<{ code: string; name: string }>();
			return createElement(SelectItem, { id: country.code }, country.name);
		},
		items: countries,
		label: 'Country',
		onChange: (value) => {
			expectTypeOf(value).toEqualTypeOf<Key | null>();
		},
	});
	SelectField<object>({
		children: [],
		label: 'Country',
		onChange: (value) => {
			expectTypeOf(value).toEqualTypeOf<Key | null>();
		},
	});
});

test('SelectField takes Key | null for static children without items', () => {
	SelectField({
		children: [createElement(SelectItem, { id: 'light', key: 'light' }, 'Light')],
		label: 'Theme',
		onChange: (value) => {
			expectTypeOf(value).toEqualTypeOf<Key | null>();
		},
	});
	SelectField({
		children: [],
		defaultValue: 'system',
		label: 'Theme',
		onChange: (value: number | string | null) => value,
		value: null,
	});
});

test('SelectField types value and defaultValue from the item keys', () => {
	SelectField({
		children: () => null,
		defaultValue: 'small',
		items: literalSizes,
		label: 'Size',
		onChange: (value) => {
			expectTypeOf(value).toEqualTypeOf<'large' | 'small' | null>();
		},
		value: 'large',
	});
	SelectField({
		children: () => null,
		items: literalSizes,
		label: 'Size',
		value: null,
	});
	SelectField({
		children: () => null,
		// @ts-expect-error — 'huge' is not the id of any item
		defaultValue: 'huge',
		items: literalSizes,
		label: 'Size',
	});
	SelectField({
		children: () => null,
		items: literalSizes,
		label: 'Size',
		// @ts-expect-error — 'huge' is not the id of any item
		value: 'huge',
	});
	SelectField({
		children: () => null,
		items: sizes,
		label: 'Size',
		// @ts-expect-error — the ids are strings
		value: 1,
	});
});

test("SelectField's selection props do not change the inferred item type", () => {
	SelectField({
		children: (size) => {
			expectTypeOf(size).toEqualTypeOf<{ id: string; label: string }>();
			return null;
		},
		items: sizes,
		label: 'Size',
		// A handler that accepts any Key is still assignable.
		onChange: (value: Key | null) => value,
		value: 'small',
	});
	SelectField({
		children: (size) => {
			expectTypeOf(size).toEqualTypeOf<{ id: string; label: string }>();
			return null;
		},
		defaultValue: 'small',
		items: sizes,
		label: 'Size',
	});
	const anyKey = 'small' as Key | null;
	SelectField({
		children: (size) => {
			expectTypeOf(size).toEqualTypeOf<{ id: string; label: string }>();
			return null;
		},
		items: sizes,
		label: 'Size',
		// @ts-expect-error — a value typed as any Key is wider than the item keys
		value: anyKey,
	});
	SelectField({
		children: () => null,
		items: literalSizes,
		label: 'Size',
		// @ts-expect-error — a handler that accepts only 'small' can't take 'large'
		onChange: (value: 'small' | null) => value,
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

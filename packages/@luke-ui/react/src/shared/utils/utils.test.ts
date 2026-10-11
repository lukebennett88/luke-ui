import type { RefCallback } from 'react';
import { assertType, expect, expectTypeOf, test } from 'vite-plus/test';
import { mergeProps } from './merge-props.js';
import { cx } from './utils.js';

test('cx joins trimmed parts with single spaces and skips empty values', () => {
	expect(cx(' first ', undefined, 'second', null, false, '', 'third')).toBe('first second third');
	expect(cx('a', '  ')).toBe('a');
	expect(cx('  ', 'a')).toBe('a');
	expect(cx()).toBe('');
});

test('merges class names and styles from left to right across four objects', () => {
	const result = mergeProps(
		{ className: ' first ', style: { color: 'red', padding: 4 } },
		{ className: 'second', style: { color: 'blue' } },
		{ className: 'third', style: { margin: 8 } },
		{ className: ' fourth ', style: { color: 'green' } },
	);

	expect(result.className).toBe('first second third fourth');
	expect(result.style).toEqual({ color: 'green', margin: 8, padding: 4 });
});

test('chains event handlers left to right and keeps other last-defined props', () => {
	const calls: Array<string> = [];
	const firstHandler = () => {
		calls.push('first');
	};
	const lastHandler = () => {
		calls.push('last');
	};
	const result = mergeProps(
		{ id: 'first', onClick: firstHandler, title: 'retained' },
		{ id: 'second', onClick: firstHandler },
		{ id: 'last', onClick: lastHandler },
	);

	expect(result.id).toBe('last');
	expect(result.title).toBe('retained');
	expect(result.onClick).not.toBe(lastHandler);
	result.onClick();
	expect(calls).toEqual(['first', 'first', 'last']);
});

test('keeps earlier className and style when a later object leaves them undefined', () => {
	const result = mergeProps(
		{ className: 'first', style: { color: 'red' } },
		{ className: undefined, style: undefined },
	);

	expect(result.className).toBe('first');
	expect(result.style).toEqual({ color: 'red' });
});

test('keeps earlier values when a later object sets a prop to undefined', () => {
	const result = mergeProps({ title: 'kept', tabIndex: 0 }, { title: undefined, tabIndex: 1 });

	expect(result.title).toBe('kept');
	expect(result.tabIndex).toBe(1);
});

test('merges refs so each callback receives the element', () => {
	const seen: Array<unknown> = [];
	const result = mergeProps(
		{ ref: (element: unknown) => seen.push(['a', element]) },
		{ ref: (element: unknown) => seen.push(['b', element]) },
	);

	result.ref('node');
	expect(seen).toEqual([
		['a', 'node'],
		['b', 'node'],
	]);
});

test('does not mutate props or their style objects', () => {
	const first = Object.freeze({ className: 'first', style: Object.freeze({ color: 'red' }) });
	const second = Object.freeze({ className: 'second', style: Object.freeze({ margin: 8 }) });
	const third = Object.freeze({ style: Object.freeze({ color: 'blue' }) });
	const result = mergeProps(first, second, third);

	expect(first.style).toEqual({ color: 'red' });
	expect(second.style).toEqual({ margin: 8 });
	expect(third.style).toEqual({ color: 'blue' });
	expect(result.style).toEqual({ color: 'blue', margin: 8 });
	expect(result.style).not.toBe(first.style);
	expect(result.style).not.toBe(second.style);
	expect(result.style).not.toBe(third.style);
});

test('infers the merged return type for fixed positional arguments', () => {
	const result = mergeProps(
		{ id: 1, title: 'retained', className: 'first' },
		{ id: 'second', style: { color: 'red' } },
		{ id: true, tabIndex: 0 },
	);

	expectTypeOf(result).toEqualTypeOf<{
		className: string;
		id: boolean;
		style: Record<string, unknown>;
		tabIndex: number;
		title: string;
	}>();
	const pair = mergeProps({ id: 1 }, { id: 'last' });
	expectTypeOf(pair).toEqualTypeOf<{ id: string }>();
});

test('widens the return type for an unknown-length array spread', () => {
	const tail: Array<{ id: boolean; extra: number }> = [];
	const result = mergeProps({ id: 1 }, { id: 'second' }, ...tail);

	expectTypeOf(result).toEqualTypeOf<{
		extra: number | undefined;
		id: string | boolean;
	}>();
});

test('ignores invalid presentation without clearing earlier values', () => {
	const result = mergeProps(
		{ className: 'first', style: { color: 'red' } },
		{ className: null, style: false },
	);
	expect(result.className).toBe('first');
	expect(result.style).toEqual({ color: 'red' });

	const absent = mergeProps({ className: null, style: false }, {});
	expect(absent.className).toBeUndefined();
	expect(absent.style).toBeUndefined();
});

test('rejects incompatible event-handler argument contracts', () => {
	const incompatible = mergeProps(
		{ onClick: (_event: string) => undefined },
		{ onClick: (_event: number) => undefined },
	);
	// @ts-expect-error Both handlers must accept the argument.
	assertType<Parameters<typeof incompatible.onClick>>(['string']);
	// @ts-expect-error Both handlers must accept the argument.
	assertType<Parameters<typeof incompatible.onClick>>([123]);

	const ambiguous: {
		onClick: ((event: string) => void) | ((event: number) => void);
	} = { onClick: (_event: string) => {} };
	const union = mergeProps(ambiguous, { onClick: (_event: unknown) => {} });
	// @ts-expect-error Every possible handler must accept the argument.
	assertType<Parameters<typeof union.onClick>>(['string']);
	// @ts-expect-error Every possible handler must accept the argument.
	assertType<Parameters<typeof union.onClick>>([123]);

	const tail: Array<{ onClick: (event: string) => void } | { onClick: (event: number) => void }> =
		[];
	const spread = mergeProps({ onClick: (_event: unknown) => {} }, {}, ...tail);
	// @ts-expect-error Every possible tail handler must accept the argument.
	assertType<Parameters<typeof spread.onClick>>(['string']);
	// @ts-expect-error Every possible tail handler must accept the argument.
	assertType<Parameters<typeof spread.onClick>>([123]);
});

test('replaces functions whose names do not begin with on and an ASCII capital', () => {
	const first = () => 'first' as const;
	const last = () => 'last' as const;
	const result = mergeProps(
		{ on_: first, on1: first, onÉ: first },
		{ on_: last, on1: last, onÉ: last },
	);
	expect(result.on_).toBe(last);
	expect(result.on1).toBe(last);
	expect(result.onÉ).toBe(last);
	expectTypeOf(result.on_).returns.toEqualTypeOf<'last'>();
	expectTypeOf(result.on1).returns.toEqualTypeOf<'last'>();
	expectTypeOf(result.onÉ).returns.toEqualTypeOf<'last'>();
});

test('types merged callback and object refs as a callback', () => {
	const seen: Array<string | null> = [];
	const objectRef: { current: string | null } = { current: null };
	const callbackRef = (node: string | null) => {
		seen.push(node);
	};
	const result = mergeProps({ ref: callbackRef }, { ref: objectRef });
	expectTypeOf(result.ref).toEqualTypeOf<RefCallback<string | null>>();
	result.ref('node');
	expect(objectRef.current).toBe('node');
	expect(seen).toEqual(['node']);

	const single = mergeProps({ ref: objectRef }, {});
	expect(single.ref).toBe(objectRef);
	expectTypeOf(single.ref).toEqualTypeOf<{ current: string | null }>();

	const optional: { ref?: { current: string | null } } = {};
	const retained = mergeProps({ ref: objectRef }, optional);
	expect(retained.ref).toBe(objectRef);
	expectTypeOf(retained.ref).toEqualTypeOf<
		{ current: string | null } | RefCallback<string | null>
	>();
});

test('preserves merged ref cleanup and clears object refs on unmount', () => {
	const seen: Array<string | null> = [];
	const objectRef: { current: string | null } = { current: null };
	const result = mergeProps(
		{
			ref: (node: string | null) => {
				seen.push(node);
				return () => {
					seen.push(null);
				};
			},
		},
		{ ref: objectRef },
	);

	const cleanup = result.ref('node');
	expect(objectRef.current).toBe('node');
	expectTypeOf(cleanup).toEqualTypeOf<ReturnType<RefCallback<string | null>>>();
	if (typeof cleanup !== 'function') throw new Error('Expected ref cleanup');
	cleanup();
	expect(objectRef.current).toBeNull();
	expect(seen).toEqual(['node', null]);
});

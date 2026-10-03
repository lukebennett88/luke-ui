import { assertType, expect, expectTypeOf, test } from 'vite-plus/test';
import { mergeStyleProps } from './utils.js';

test('merges class names and styles from left to right across four objects', () => {
	const result = mergeStyleProps(
		{ className: ' first ', style: { color: 'red', padding: 4 } },
		{ className: 'second', style: { color: 'blue' } },
		{ className: 'third', style: { margin: 8 } },
		{ className: ' fourth ', style: { color: 'green' } },
	);

	expect(result.className).toBe('first second third fourth');
	expect(result.style).toEqual({ color: 'green', margin: 8, padding: 4 });
});

test('replaces other properties and handlers with the last supplied value', () => {
	const firstHandler = () => 'first';
	const lastHandler = () => 'last';
	const result = mergeStyleProps(
		{ id: 'first', onClick: firstHandler, title: 'retained' },
		{ id: 'second', onClick: firstHandler },
		{ id: 'last', onClick: lastHandler },
	);

	expect(result.id).toBe('last');
	expect(result.title).toBe('retained');
	expect(result.onClick).toBe(lastHandler);
});

test('keeps the first object’s own enumerable symbol properties without copying its prototype', () => {
	const metadata = Symbol('metadata');
	class Props {
		[metadata] = 'retained';
		id = 'first';
	}
	Object.defineProperty(Props.prototype, 'inherited', { enumerable: true, value: 'excluded' });
	const first = new Props();
	Object.defineProperty(first, 'hidden', { value: 'excluded' });
	const result = mergeStyleProps(first, {});

	expect(result[metadata]).toBe('retained');
	expect(result.id).toBe('first');
	expect(result).not.toHaveProperty('inherited');
	expect(result).not.toHaveProperty('hidden');
});

test('does not mutate props or their style objects', () => {
	const first = Object.freeze({ className: 'first', style: Object.freeze({ color: 'red' }) });
	const second = Object.freeze({ className: 'second', style: Object.freeze({ margin: 8 }) });
	const third = Object.freeze({ style: Object.freeze({ color: 'blue' }) });
	const result = mergeStyleProps(first, second, third);

	expect(first.style).toEqual({ color: 'red' });
	expect(second.style).toEqual({ margin: 8 });
	expect(third.style).toEqual({ color: 'blue' });
	expect(result.style).toEqual({ color: 'blue', margin: 8 });
	expect(result.style).not.toBe(first.style);
	expect(result.style).not.toBe(second.style);
	expect(result.style).not.toBe(third.style);
});

test('ignores non-string class names and non-object styles', () => {
	const result = mergeStyleProps(
		{ className: 123, style: null },
		{ className: 'valid', style: { color: 'red' } },
		{ className: () => 'ignored', style: 'ignored' },
		{ className: false, style: undefined },
	);

	expect(result.className).toBe('valid');
	expect(result.style).toEqual({ color: 'red' });
	expect(mergeStyleProps({}, {})).toEqual({ className: '', style: {} });
});

test('preserves the merged type of fixed tuples', () => {
	const result = mergeStyleProps(
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
	const pair = mergeStyleProps({ id: 1 }, { id: 'last' });
	expectTypeOf(pair).toEqualTypeOf<{ id: string }>();
});

test('rejects spreading an array of unknown length', () => {
	const tail: Array<{ id: boolean }> = [];

	// @ts-expect-error A spread array has no fixed length.
	assertType(mergeStyleProps({ id: 1 }, { title: 'a' }, ...tail));
});

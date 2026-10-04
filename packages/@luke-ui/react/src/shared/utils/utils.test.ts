import { expect, expectTypeOf, test } from 'vite-plus/test';
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

test('infers the merged return type for fixed positional arguments', () => {
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

test('widens the return type for an unknown-length array spread', () => {
	const tail: Array<{ id: boolean; extra: number }> = [];
	const result = mergeStyleProps({ id: 1 }, { id: 'second' }, ...tail);

	expectTypeOf(result).toEqualTypeOf<{
		extra: number | undefined;
		id: string | boolean;
	}>();
});

import { expect, expectTypeOf, test } from 'vite-plus/test';
import { fitContent, minmax, repeat } from './track-functions.js';

test('repeat builds a repeat() track list with a narrow literal type', () => {
	const equal = repeat(3, '1fr');
	const autoFit = repeat('auto-fit', minmax('min(12rem, 100%)', '1fr'));
	const autoFill = repeat('auto-fill', '10rem');

	expect(equal).toBe('repeat(3, 1fr)');
	expect(autoFit).toBe('repeat(auto-fit, minmax(min(12rem, 100%), 1fr))');
	expect(autoFill).toBe('repeat(auto-fill, 10rem)');
	expectTypeOf(equal).toEqualTypeOf<'repeat(3, 1fr)'>();
	expectTypeOf(autoFit).toEqualTypeOf<'repeat(auto-fit, minmax(min(12rem, 100%), 1fr))'>();
	expectTypeOf(autoFill).toEqualTypeOf<'repeat(auto-fill, 10rem)'>();
});

test('minmax builds a minmax() track size with a narrow literal type', () => {
	const size = minmax('0', '1fr');
	const empty = minmax('', '1fr');

	expect(size).toBe('minmax(0, 1fr)');
	expect(empty).toBe('minmax(, 1fr)');
	expectTypeOf(size).toEqualTypeOf<'minmax(0, 1fr)'>();
	expectTypeOf(empty).toEqualTypeOf<'minmax(, 1fr)'>();
});

test('fitContent builds a fit-content() track size with a narrow literal type', () => {
	const size = fitContent('20rem');

	expect(size).toBe('fit-content(20rem)');
	expectTypeOf(size).toEqualTypeOf<'fit-content(20rem)'>();
});

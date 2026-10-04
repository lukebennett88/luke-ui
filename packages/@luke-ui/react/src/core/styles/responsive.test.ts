import { expect, test } from 'vite-plus/test';
import { isPopulatedString, isPositiveInteger, withResponsiveDefault } from './responsive.js';

test('isPositiveInteger accepts only integers greater than zero', () => {
	expect(isPositiveInteger(1)).toBe(true);
	expect(isPositiveInteger(3)).toBe(true);
	expect(isPositiveInteger(0)).toBe(false);
	expect(isPositiveInteger(-1)).toBe(false);
	expect(isPositiveInteger(1.5)).toBe(false);
	expect(isPositiveInteger('3')).toBe(false);
	expect(isPositiveInteger(null)).toBe(false);
});

test('isPopulatedString accepts only strings with non-whitespace content', () => {
	expect(isPopulatedString('12rem 1fr')).toBe(true);
	expect(isPopulatedString(' a ')).toBe(true);
	expect(isPopulatedString('')).toBe(false);
	expect(isPopulatedString(' \t\n')).toBe(false);
	expect(isPopulatedString(3)).toBe(false);
	expect(isPopulatedString(null)).toBe(false);
});

test('withResponsiveDefault returns a direct array unchanged', () => {
	const rows = ['a b', 'c d'];

	expect(withResponsiveDefault<ReadonlyArray<string>>(rows, ['default'])).toBe(rows);
});

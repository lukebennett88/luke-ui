import { expect, test } from 'vite-plus/test';
import { isNonEmptyString, isPositiveInteger, withResponsiveDefault } from './responsive.js';

test('isPositiveInteger accepts only integers greater than zero', () => {
	expect(isPositiveInteger(1)).toBe(true);
	expect(isPositiveInteger(3)).toBe(true);
	expect(isPositiveInteger(0)).toBe(false);
	expect(isPositiveInteger(-1)).toBe(false);
	expect(isPositiveInteger(1.5)).toBe(false);
	expect(isPositiveInteger('3')).toBe(false);
	expect(isPositiveInteger(null)).toBe(false);
});

test('isNonEmptyString accepts only strings with non-whitespace content', () => {
	expect(isNonEmptyString('12rem 1fr')).toBe(true);
	expect(isNonEmptyString(' a ')).toBe(true);
	expect(isNonEmptyString('')).toBe(false);
	expect(isNonEmptyString(' \t\n')).toBe(false);
	expect(isNonEmptyString(3)).toBe(false);
	expect(isNonEmptyString(null)).toBe(false);
});

test('withResponsiveDefault returns a direct array unchanged', () => {
	const rows = ['a b', 'c d'];

	expect(withResponsiveDefault<ReadonlyArray<string>>(rows, ['default'])).toBe(rows);
});

import { assertType, expect, test } from 'vite-plus/test';
import { isPositiveInteger } from '../styles/responsive.js';
import type { GridProps } from './grid.js';

test('isPositiveInteger accepts only integers greater than zero', () => {
	expect(isPositiveInteger(1)).toBe(true);
	expect(isPositiveInteger(3)).toBe(true);
	expect(isPositiveInteger(0)).toBe(false);
	expect(isPositiveInteger(-1)).toBe(false);
	expect(isPositiveInteger(1.5)).toBe(false);
	expect(isPositiveInteger('3')).toBe(false);
	expect(isPositiveInteger(null)).toBe(false);
});

test('Grid rejects the props it does not support', () => {
	// @ts-expect-error — responsive columns require an initial value
	assertType<GridProps>({ columns: { bp768: 3 } });
	// @ts-expect-error — Grid does not expose Box appearance utilities
	assertType<GridProps>({ backgroundColor: 'surface.canvas', columns: 2 });
	// @ts-expect-error — Grid has no display prop
	assertType<GridProps>({ columns: 2, display: 'flex' });
});

import { expect, test } from 'vite-plus/test';
import { rem } from './rem.js';

test('converts values at a 16px root to rem', () => {
	expect(rem(4)).toBe('0.25rem');
	expect(rem(8)).toBe('0.5rem');
	expect(rem(16)).toBe('1rem');
	expect(rem(24)).toBe('1.5rem');
	expect(rem(35)).toBe('2.1875rem');
	expect(rem(40)).toBe('2.5rem');
	expect(rem(448)).toBe('28rem');
});

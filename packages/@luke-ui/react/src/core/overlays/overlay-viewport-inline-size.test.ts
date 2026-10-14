import { expect, test } from 'vite-plus/test';
import { availableInlineSizeForContainerPadding } from './overlay-viewport-inline-size.js';

test('availableInlineSizeForContainerPadding subtracts padding on both sides', () => {
	expect(availableInlineSizeForContainerPadding(12, 414)).toBe(390);
	expect(availableInlineSizeForContainerPadding(40, 414)).toBe(334);
	expect(availableInlineSizeForContainerPadding(0, 414)).toBe(414);
});

test('availableInlineSizeForContainerPadding does not go below zero', () => {
	expect(availableInlineSizeForContainerPadding(12, 20)).toBe(0);
	expect(availableInlineSizeForContainerPadding(12, 0)).toBe(0);
});

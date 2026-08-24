import { describe, expect, it } from 'vite-plus/test';
import { deriveConcentricRadius, deriveNestedRadius } from './foundation.js';

describe('concentric corners', () => {
	it('derives the outer radius from inner-radius and gap values', () => {
		expect(deriveConcentricRadius('var(--luke-radius-control)', 'var(--luke-space-sp8)')).toBe(
			'calc(var(--luke-radius-control) + var(--luke-space-sp8))',
		);
	});

	it('derives the inner radius from outer-radius and gap values', () => {
		expect(deriveNestedRadius('var(--luke-radius-surface)', 'var(--luke-space-sp12)')).toBe(
			'max(0px, calc(var(--luke-radius-surface) - var(--luke-space-sp12)))',
		);
	});
});

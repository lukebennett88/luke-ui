import { describe, expect, it } from 'vite-plus/test';
import { deriveConcentricRadius, deriveNestedRadius } from './foundation.js';

describe('concentric corners', () => {
	it('derives the outer radius from semantic inner-radius and gap values', () => {
		expect(deriveConcentricRadius('var(--luke-radius-control)', 'var(--luke-space-200)')).toBe(
			'calc(var(--luke-radius-control) + var(--luke-space-200))',
		);
	});

	it('derives the inner radius from semantic outer-radius and gap values', () => {
		expect(deriveNestedRadius('var(--luke-radius-surface)', 'var(--luke-space-300)')).toBe(
			'max(0px, calc(var(--luke-radius-surface) - var(--luke-space-300)))',
		);
	});
});

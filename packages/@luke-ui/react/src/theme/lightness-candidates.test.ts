import { expect, test } from 'vite-plus/test';
import { CONTRAST_SEARCH_STEP } from './contrast-policy.js';
import { lightnessCandidates } from './lightness-candidates.js';

test('yields a single clamped value when from equals to, and nothing for a non-finite band', () => {
	expect([...lightnessCandidates(0.5, 0.5)]).toEqual([0.5]);
	expect([...lightnessCandidates(1.2, 1.2)]).toEqual([1]);
	expect([...lightnessCandidates(Number.NaN, 0.5)]).toEqual([]);
	expect([...lightnessCandidates(0.5, Number.NaN)]).toEqual([]);
});

test('walks the fixed step from from toward to without appending an off-grid endpoint', () => {
	const band = [...lightnessCandidates(0.4, 0.62)];
	expect(band[0]).toBe(0.4);
	expect(band.at(-1)).toBeCloseTo(0.62, 12);
	expect(band).toHaveLength(Math.round((0.62 - 0.4) / CONTRAST_SEARCH_STEP) + 1);

	const offGridEnd = [...lightnessCandidates(0.4, 0.621)];
	expect(offGridEnd.at(-1)).toBeCloseTo(0.62, 12);
	expect(offGridEnd).not.toContain(0.621);
});

test('includes 0 and 1 only when that boundary is the destination', () => {
	expect([...lightnessCandidates(0.005, 0)].at(-1)).toBe(0);
	expect([...lightnessCandidates(0.995, 1)].at(-1)).toBe(1);

	const towardZero = [...lightnessCandidates(0.005, 0.001)];
	expect(towardZero.at(-1)).toBeCloseTo(0.0025, 12);
	expect(towardZero).not.toContain(0);

	const towardOne = [...lightnessCandidates(0.995, 0.999)];
	expect(towardOne.at(-1)).toBeCloseTo(0.9975, 12);
	expect(towardOne).not.toContain(1);
});

import { describe, expect, it } from 'vite-plus/test';
import { CONTRAST_SEARCH_STEP } from './contrast-policy.js';
import { lightnessCandidates } from './lightness-candidates.js';

/** First grid value that satisfies `predicate`, or `undefined` when none does. */
function firstMatch(
	from: number,
	to: number,
	predicate: (lightness: number) => boolean,
): number | undefined {
	for (const lightness of lightnessCandidates(from, to)) {
		if (predicate(lightness)) return lightness;
	}
	return undefined;
}

describe('lightnessCandidates', () => {
	it('yields a single clamped value when from equals to', () => {
		expect([...lightnessCandidates(0.5, 0.5)]).toEqual([0.5]);
		expect([...lightnessCandidates(1.2, 1.2)]).toEqual([1]);
	});

	it('yields nothing for an empty non-finite band', () => {
		expect([...lightnessCandidates(Number.NaN, 0.5)]).toEqual([]);
		expect([...lightnessCandidates(0.5, Number.NaN)]).toEqual([]);
		expect(firstMatch(Number.NaN, 0.5, () => true)).toBeUndefined();
	});

	it('walks the fixed step from from toward to without appending an off-grid endpoint', () => {
		const band = [...lightnessCandidates(0.4, 0.62)];
		expect(band[0]).toBe(0.4);
		expect(band.at(-1)).toBeCloseTo(0.62, 12);
		expect(band).toHaveLength(Math.round((0.62 - 0.4) / CONTRAST_SEARCH_STEP) + 1);

		const offGridEnd = [...lightnessCandidates(0.4, 0.621)];
		expect(offGridEnd.at(-1)).toBeCloseTo(0.62, 12);
		expect(offGridEnd).not.toContain(0.621);
	});

	it('walks a band that starts at 0 instead of stopping on the first clamp', () => {
		const values = [...lightnessCandidates(0, 0.01)];
		expect(values[0]).toBe(0);
		expect(values.length).toBeGreaterThan(1);
		expect(values.at(-1)).toBeCloseTo(0.01, 12);
	});

	it('walks downward and stops when clamping saturates', () => {
		const values = [...lightnessCandidates(0.005, 0)];
		expect(values[0]).toBe(0.005);
		expect(values.at(-1)).toBe(0);
		expect(values.every((lightness) => lightness >= 0 && lightness <= 1)).toBe(true);
	});

	it('does not append 0 when the destination is off-grid just above 0', () => {
		const values = [...lightnessCandidates(0.005, 0.001)];
		expect(values[0]).toBe(0.005);
		expect(values.at(-1)).toBeCloseTo(0.0025, 12);
		expect(values).not.toContain(0);
		expect(values).not.toContain(0.001);
	});

	it('does not append 1 when the destination is off-grid just below 1', () => {
		const values = [...lightnessCandidates(0.995, 0.999)];
		expect(values[0]).toBe(0.995);
		expect(values.at(-1)).toBeCloseTo(0.9975, 12);
		expect(values).not.toContain(1);
		expect(values).not.toContain(0.999);
	});

	it('yields 0 when the destination is exactly 0', () => {
		expect([...lightnessCandidates(0.005, 0)].at(-1)).toBe(0);
		expect([...lightnessCandidates(0.006, 0)].at(-1)).toBe(0);
	});

	it('yields 1 when the destination is exactly 1', () => {
		expect([...lightnessCandidates(0.995, 1)].at(-1)).toBe(1);
		expect([...lightnessCandidates(0.996, 1)].at(-1)).toBe(1);
	});

	it('walks downward toward a lower destination rather than treating it as empty', () => {
		const values = [...lightnessCandidates(0.5, 0.49)];
		expect(values[0]).toBe(0.5);
		expect(values.at(-1)).toBeCloseTo(0.49, 12);
		expect(values.length).toBeGreaterThan(1);
	});

	it('lets a caller select with a synthetic predicate', () => {
		expect(firstMatch(0.4, 0.62, (lightness) => lightness >= 0.5)).toBeCloseTo(0.5, 12);
	});

	it('returns no match when the predicate nothing satisfies', () => {
		expect(firstMatch(0.4, 0.62, () => false)).toBeUndefined();
		expect(firstMatch(0.5, 0.5, () => false)).toBeUndefined();
	});
});

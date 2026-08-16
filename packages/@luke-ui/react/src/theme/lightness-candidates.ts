/**
 * The shared OKLCH lightness candidate grid every contrast search walks. It owns stepping, direction,
 * clamping, and stopping, and yields lightness numbers. Callers keep their own selection rule,
 * contrast predicate, colour construction, and diagnostics.
 */

import { clampUnit } from './color.js';
import { CONTRAST_SEARCH_STEP } from './contrast-policy.js';

/** Inclusive comparison slack so a grid point that lands on `to` is not dropped to float error. */
const ENDPOINT_EPSILON = 1e-9;

/**
 * Yields the fixed lightness grid from `from` toward `to`. Each value is clamped to `[0, 1]`. The
 * start is always included when the range is finite. The destination is included only when it lands
 * on the grid; an off-grid `to` is not appended. When `from === to`, yields that single clamped
 * value. Stops when the next step would pass `to`, or when clamping saturates at 0 or 1.
 */
export function* lightnessCandidates(from: number, to: number): Generator<number, void, void> {
	if (!Number.isFinite(from) || !Number.isFinite(to)) return;
	if (from === to) {
		yield clampUnit(from);
		return;
	}
	const direction = to > from ? 1 : -1;
	const step = direction * CONTRAST_SEARCH_STEP;
	let index = 0;
	for (;;) {
		const raw = from + index * step;
		const clamped = clampUnit(raw);
		yield clamped;
		const nextRaw = raw + step;
		const nextClamped = clampUnit(nextRaw);
		if (nextClamped === clamped) return;
		if (hasPassedEnd(nextRaw, to, direction)) {
			if (nextClamped === 0 || nextClamped === 1) yield nextClamped;
			return;
		}
		index += 1;
	}
}

function hasPassedEnd(raw: number, to: number, direction: number): boolean {
	return direction > 0 ? raw > to + ENDPOINT_EPSILON : raw < to - ENDPOINT_EPSILON;
}

import type { Zoom } from './review-params.js';

/**
 * The difference `offset` steps from `active`, wrapping at either end. With no difference selected,
 * stepping forward starts at the first and back at the last.
 */
export function steppedDifference(
	active: number | undefined,
	count: number,
	offset: number,
): number {
	const from = active ?? (offset > 0 ? -1 : count);
	return (from + offset + count) % count;
}

/**
 * The zoom to jump to a difference at: at least 100%, so a tiny change is large enough to judge.
 * A capture scaled down to fit shows at actual size, panned to the difference. One that already
 * fits its width at actual size keeps fitting it, and a zoom above 100% stays.
 */
export function differenceZoom(
	zoom: Zoom,
	{ availableWidth, captureWidth }: { availableWidth: number; captureWidth: number | undefined },
): Zoom {
	if (zoom === '0.5') return '1';
	if (zoom !== 'fit' && zoom !== 'screen') return zoom;
	return (captureWidth ?? 0) > availableWidth ? '1' : 'fit';
}

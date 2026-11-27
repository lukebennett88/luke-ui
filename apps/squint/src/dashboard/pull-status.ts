import type { Review } from '../api/review-api.js';

/** Pull requests that need review first. Each group keeps its order. */
export function orderByReview<T extends { review?: Review | null }>(
	pulls: ReadonlyArray<T>,
): Array<T> {
	const needsReview = pulls.filter((pull) => pull.review?.state === 'needs-review');
	const rest = pulls.filter((pull) => pull.review?.state !== 'needs-review');
	return [...needsReview, ...rest];
}

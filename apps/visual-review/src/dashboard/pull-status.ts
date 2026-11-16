import type { Review } from '../api/review-api.js';

type ChipColor = 'danger' | 'secondary' | 'success' | 'warning';

/** The dashboard's status chip for a pull request's review. `null` means no check run yet. */
export function reviewChip(review: Review | null): { color: ChipColor; label: string } {
	if (!review) return { color: 'secondary', label: 'No report' };
	return REVIEW_CHIPS[review.state];
}

const REVIEW_CHIPS = {
	approved: { color: 'success', label: 'Approved' },
	'changes-requested': { color: 'danger', label: 'Changes requested' },
	clean: { color: 'secondary', label: 'No visual changes' },
	failed: { color: 'danger', label: 'Comparison failed' },
	'needs-review': { color: 'warning', label: 'Needs review' },
} as const satisfies Record<Review['state'], { color: ChipColor; label: string }>;

/** Pull requests that need review first. Each group keeps its order. */
export function orderByReview<T extends { review?: Review | null }>(
	pulls: ReadonlyArray<T>,
): Array<T> {
	const needsReview = pulls.filter((pull) => pull.review?.state === 'needs-review');
	const rest = pulls.filter((pull) => pull.review?.state !== 'needs-review');
	return [...needsReview, ...rest];
}

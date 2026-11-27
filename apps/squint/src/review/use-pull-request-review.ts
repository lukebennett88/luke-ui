import { useEffect, useState } from 'react';
import type { ApiResult, PullReview, Review, Session } from '../api/review-api.js';
import { fetchPullReview, fetchSession } from '../api/review-api.js';

/** The pull request's review, as far as the backend has answered. */
type PullReviewState =
	| { kind: 'loading' }
	/** No review backend answered, such as on the development server. */
	| { kind: 'unavailable' }
	/** The backend answered with an error, or with a response the app could not read. */
	| { kind: 'failed' }
	/** `review` is `null` when the head commit has no review check run. */
	| { kind: 'loaded'; review: Review | null };

/** The visitor's session, or `loading` until the backend answers. */
type SessionState = ApiResult<Session> | { kind: 'loading' };

/** A pull request's review and the visitor's session, as the review backend reports them. */
export type PullRequestReview = {
	number: number;
	/** Shows a decision the backend saved. */
	onReview: (review: Review) => void;
	pullReview: PullReviewState;
	/** Reads the session again, after a sign-out or when access changes. */
	refreshSession: () => void;
	session: SessionState;
};

const LOADING = { kind: 'loading' } as const;

/**
 * Loads a pull request's review and the session. A local comparison has no pull request, so it
 * passes `undefined` and gets nothing.
 */
export function usePullRequestReview(number: number | undefined): PullRequestReview | undefined {
	const [pullReview, setPullReview] = useState<PullReviewState>(LOADING);
	const [session, setSession] = useState<SessionState>(LOADING);

	useEffect(() => {
		if (number === undefined) return;
		let isActive = true;
		void fetchPullReview(number).then((result) => {
			if (isActive) setPullReview(pullReviewState(result));
		});
		void fetchSession().then((result) => {
			if (isActive) setSession(result);
		});
		return () => {
			isActive = false;
		};
	}, [number]);

	if (number === undefined) return undefined;
	return {
		number,
		onReview: (review) => {
			setPullReview((current) =>
				current.kind === 'loaded' ? { kind: 'loaded', review } : current,
			);
		},
		pullReview,
		refreshSession: () => {
			void fetchSession().then(setSession);
		},
		session,
	};
}

function pullReviewState(result: ApiResult<PullReview>): PullReviewState {
	switch (result.kind) {
		case 'ok':
			return { kind: 'loaded', review: result.data.review };
		case 'unavailable':
			return { kind: 'unavailable' };
		case 'error':
			return { kind: 'failed' };
	}
}

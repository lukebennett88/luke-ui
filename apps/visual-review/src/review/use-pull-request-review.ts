import { useEffect, useState } from 'react';
import type { ApiResult, PullReview, Review, Session } from '../api/review-api.js';
import { fetchPullReview, fetchSession } from '../api/review-api.js';

/** A pull request's review and the visitor's session, as the review backend reports them. */
export type PullRequestReview = {
	number: number;
	/** Shows a decision the backend saved. */
	onReview: (review: Review) => void;
	/** `undefined` while it loads. */
	pullReview: ApiResult<PullReview> | undefined;
	/** Reads the session again, after a sign-out or when access changes. */
	refreshSession: () => void;
	/** `undefined` while it loads. */
	session: ApiResult<Session> | undefined;
};

/**
 * Loads a pull request's review and the session. A local comparison has no pull request, so it
 * passes `undefined` and gets nothing.
 */
export function usePullRequestReview(number: number | undefined): PullRequestReview | undefined {
	const [pullReview, setPullReview] = useState<ApiResult<PullReview>>();
	const [session, setSession] = useState<ApiResult<Session>>();

	useEffect(() => {
		if (number === undefined) return;
		let isActive = true;
		void fetchPullReview(number).then((result) => {
			if (isActive) setPullReview(result);
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
				current?.kind === 'ok' ? { data: { ...current.data, review }, kind: 'ok' } : current,
			);
		},
		pullReview,
		refreshSession: () => {
			void fetchSession().then(setSession);
		},
		session,
	};
}

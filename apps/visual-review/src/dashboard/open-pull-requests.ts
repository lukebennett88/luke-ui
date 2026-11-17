import { z } from 'zod';
import type { Review } from '../api/review-api.js';
import { fetchPulls } from '../api/review-api.js';
import { repository } from '../config.js';

const pullRequestsSchema = z.array(
	z.object({
		draft: z.boolean().optional(),
		head: z.object({ ref: z.string(), sha: z.string() }),
		number: z.number().int().positive(),
		title: z.string(),
		user: z.object({ login: z.string() }).nullable(),
	}),
);

export type PullRequest = {
	author: string | null;
	draft: boolean;
	headRef: string;
	headSha: string;
	number: number;
	/** The head commit's review. `undefined` when the list came without the review backend. */
	review?: Review | null;
	title: string;
};

export type PullRequestsResult =
	| { pullRequests: Array<PullRequest>; status: 'ready' }
	| { status: 'failed' }
	| { status: 'rate-limited' };

let pending: Promise<PullRequestsResult> | undefined;

/**
 * Lists the repository's open pull requests once per page load: from the review backend, with each
 * one's review, or from GitHub's public API where no backend answers, such as the development
 * server. The promise never rejects: every failure is a state the dashboard renders.
 */
export function loadOpenPullRequests(): Promise<PullRequestsResult> {
	pending ??= fetchOpenPullRequests();
	return pending;
}

async function fetchOpenPullRequests(): Promise<PullRequestsResult> {
	const result = await fetchPulls();
	if (result.kind === 'ok') {
		const pullRequests = result.data.pulls.map(({ url: _url, ...pull }) => pull);
		return { pullRequests, status: 'ready' };
	}
	return fetchFromGitHub();
}

async function fetchFromGitHub(): Promise<PullRequestsResult> {
	try {
		const response = await fetch(
			`https://api.github.com/repos/${repository}/pulls?state=open&per_page=100`,
			{ headers: { Accept: 'application/vnd.github+json' } },
		);
		if (response.status === 403 || response.status === 429) return { status: 'rate-limited' };
		if (!response.ok) return { status: 'failed' };
		const pullRequests = pullRequestsSchema.parse(await response.json()).map((pull) => ({
			author: pull.user?.login ?? null,
			draft: pull.draft ?? false,
			headRef: pull.head.ref,
			headSha: pull.head.sha,
			number: pull.number,
			title: pull.title,
		}));
		return { pullRequests, status: 'ready' };
	} catch {
		return { status: 'failed' };
	}
}

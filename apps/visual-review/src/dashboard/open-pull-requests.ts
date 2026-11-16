import { z } from 'zod';
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

export type PullRequest = z.infer<typeof pullRequestsSchema>[number];

export type PullRequestsResult =
	| { pullRequests: Array<PullRequest>; status: 'ready' }
	| { status: 'failed' }
	| { status: 'rate-limited' };

let pending: Promise<PullRequestsResult> | undefined;

/**
 * Lists the repository's open pull requests from GitHub's public API, once per page load. The
 * promise never rejects: every failure is a state the dashboard renders.
 */
export function loadOpenPullRequests(): Promise<PullRequestsResult> {
	pending ??= fetchOpenPullRequests();
	return pending;
}

async function fetchOpenPullRequests(): Promise<PullRequestsResult> {
	try {
		const response = await fetch(
			`https://api.github.com/repos/${repository}/pulls?state=open&per_page=100`,
			{ headers: { Accept: 'application/vnd.github+json' } },
		);
		if (response.status === 403 || response.status === 429) return { status: 'rate-limited' };
		if (!response.ok) return { status: 'failed' };
		return { pullRequests: pullRequestsSchema.parse(await response.json()), status: 'ready' };
	} catch {
		return { status: 'failed' };
	}
}

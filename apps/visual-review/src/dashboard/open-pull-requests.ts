import { z } from 'zod';
import { repository } from '../config.js';

const CACHE_KEY = `visual-review:open-pull-requests:${repository}`;
/** GitHub allows 60 anonymous requests an hour per address, so reloads reuse a recent answer. */
const CACHE_LIFETIME_MS = 60_000;

const pullRequestsSchema = z.array(
	z.object({
		draft: z.boolean().optional(),
		head: z.object({ ref: z.string(), sha: z.string() }),
		number: z.number().int().positive(),
		title: z.string(),
		user: z.object({ login: z.string() }).nullable(),
	}),
);

const cacheSchema = z.object({ pullRequests: pullRequestsSchema, storedAt: z.number() });

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
	const cached = readCache();
	if (cached) return { pullRequests: cached, status: 'ready' };
	try {
		const response = await fetch(
			`https://api.github.com/repos/${repository}/pulls?state=open&per_page=100`,
			{ headers: { Accept: 'application/vnd.github+json' } },
		);
		if (response.status === 403 || response.status === 429) return { status: 'rate-limited' };
		if (!response.ok) return { status: 'failed' };
		const pullRequests = pullRequestsSchema.parse(await response.json());
		writeCache(pullRequests);
		return { pullRequests, status: 'ready' };
	} catch {
		return { status: 'failed' };
	}
}

function readCache(): Array<PullRequest> | undefined {
	try {
		const stored = sessionStorage.getItem(CACHE_KEY);
		if (stored === null) return undefined;
		const { pullRequests, storedAt } = cacheSchema.parse(JSON.parse(stored));
		return Date.now() - storedAt < CACHE_LIFETIME_MS ? pullRequests : undefined;
	} catch {
		return undefined;
	}
}

function writeCache(pullRequests: Array<PullRequest>) {
	try {
		sessionStorage.setItem(CACHE_KEY, JSON.stringify({ pullRequests, storedAt: Date.now() }));
	} catch {
		// Storage can be unavailable or full. The dashboard works without the cache.
	}
}

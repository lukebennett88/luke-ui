import { z } from 'zod';
import type { Config } from './config.js';
import type { Deps, GitHubApp } from './github.js';
import { githubFetch, readGitHubJson } from './github.js';
import { ApiError } from './http.js';
import type { Session } from './session.js';
import { parseSession, readCookie, SESSION_COOKIE, verifyToken } from './session.js';

/** One request, with the configuration and dependencies its route needs. */
export interface Context {
	config: Config;
	deps: Deps;
	github: GitHubApp;
	request: Request;
	url: URL;
}

const REVIEW_ROLES = new Set(['admin', 'maintain', 'write']);

const accountSchema = z.object({ id: z.number(), login: z.string() });
const permissionSchema = z.object({
	permission: z.string(),
	role_name: z.string().optional(),
	user: z.object({ id: z.number() }).nullable(),
});

export function nowSeconds(context: Context): number {
	return Math.floor(context.deps.now() / 1000);
}

/** Calls the GitHub API with the App's installation token. */
export async function installationFetch(
	context: Context,
	path: string,
	options: { body?: unknown; method?: 'GET' | 'PATCH' | 'POST' } = {},
): Promise<Response> {
	const token = await context.github.installationToken(context.config);
	return githubFetch(context.deps, path, { ...options, token });
}

/** The signed-in reviewer, or `undefined` when the session cookie is missing, forged or expired. */
export async function readSession(context: Context): Promise<Session | undefined> {
	const token = readCookie(context.request, SESSION_COOKIE);
	if (!token) return undefined;
	return parseSession(
		await verifyToken(context.config.sessionSecret, SESSION_COOKIE, token, nowSeconds(context)),
	);
}

/**
 * The account's current login when it can review, or `undefined` when it cannot. An account can
 * review when it has the admin, maintain or write role on the repository. The session's login can
 * be out of date after a rename, so this reads the login from the account's immutable id and
 * checks that the permission belongs to that same id. It asks GitHub on every call, so removing
 * someone's access takes effect before their session ends.
 */
export async function reviewerLogin(
	context: Context,
	session: Pick<Session, 'id'>,
): Promise<string | undefined> {
	const accountResponse = await installationFetch(context, `/user/${session.id}`);
	if (accountResponse.status === 404) return undefined;
	const account = await readGitHubJson(accountResponse, accountSchema, 'account');
	if (account.id !== session.id) return undefined;
	const response = await installationFetch(
		context,
		`/repos/${context.config.repository}/collaborators/${encodeURIComponent(account.login)}/permission`,
	);
	if (response.status === 404) return undefined;
	const access = await readGitHubJson(response, permissionSchema, 'collaborator permission');
	if (access.user?.id !== session.id) return undefined;
	// `role_name` names maintain and custom roles. `permission` is the base role behind them.
	const allowed = REVIEW_ROLES.has(access.role_name ?? '') || REVIEW_ROLES.has(access.permission);
	return allowed ? account.login : undefined;
}

/**
 * Guards a state-changing request. `pr-<n>.<project>.pages.dev` deployments are same-site with the
 * app, because `pages.dev` is a public suffix, so `SameSite` cookies alone do not stop them. The
 * exact `Origin` does. A JSON content type also rules out a cross-origin form post.
 */
export function assertSameOrigin(context: Context): void {
	if (context.request.headers.get('Origin') !== context.config.appOrigin) {
		throw new ApiError(403, 'bad-origin', 'The request did not come from the review app.');
	}
	const mediaType = context.request.headers.get('Content-Type')?.split(';')[0]?.trim();
	if (mediaType?.toLowerCase() !== 'application/json') {
		throw new ApiError(400, 'invalid', 'Send the request as application/json.');
	}
}

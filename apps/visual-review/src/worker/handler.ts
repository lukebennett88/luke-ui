import type { Context } from './access.js';
import { callback, login, logout, session } from './auth.js';
import type { Env } from './config.js';
import { readConfig } from './config.js';
import type { Deps } from './github.js';
import { createGitHubApp } from './github.js';
import { ApiError, errorResponse, json } from './http.js';
import { decide, getReview, listPulls } from './pulls.js';

type Method = 'GET' | 'POST';

/** The part of the Pages Functions execution context the worker uses. */
export interface ExecutionContext {
	waitUntil: (promise: Promise<unknown>) => void;
}
type Route = (context: Context, number: number) => Promise<Response> | Response;

const STATIC_ROUTES: Record<string, { handler: Route; method: Method }> = {
	'/api/auth/callback': { handler: callback, method: 'GET' },
	'/api/auth/login': { handler: login, method: 'GET' },
	'/api/auth/logout': { handler: logout, method: 'POST' },
	'/api/pulls': { handler: listPulls, method: 'GET' },
	'/api/session': { handler: session, method: 'GET' },
};

const PULL_ROUTES: Record<string, { handler: Route; method: Method }> = {
	decision: { handler: decide, method: 'POST' },
	review: { handler: getReview, method: 'GET' },
};

const PULL_ROUTE_PATTERN = /^\/api\/pulls\/(\d+)\/(decision|review)$/;

/**
 * Creates the worker's request handler. Every GitHub call goes through `deps.fetch`, so tests
 * pass a stub. The App's token cache lives as long as the returned function.
 */
export function createHandler(
	deps: Deps,
): (request: Request, env: Env, executionContext?: ExecutionContext) => Promise<Response> {
	const github = createGitHubApp(deps);

	return async function handle(request, env, executionContext) {
		const url = new URL(request.url);
		if (!url.pathname.startsWith('/api/')) {
			return env.ASSETS ? env.ASSETS.fetch(request) : new Response(null, { status: 404 });
		}
		const config = readConfig(env);
		if (!config) {
			return json(
				{ error: 'unconfigured', message: 'The review backend is not configured here.' },
				{ status: 503 },
			);
		}
		try {
			const { number, route } = matchRoute(url.pathname);
			if (request.method !== route.method) {
				return errorResponse(
					new ApiError(405, 'method-not-allowed', `Use ${route.method} for this route.`),
					{ headers: { Allow: route.method } },
				);
			}
			const waitUntil = (promise: Promise<unknown>) => executionContext?.waitUntil(promise);
			return await route.handler({ config, deps, github, request, url, waitUntil }, number);
		} catch (error) {
			return errorResponse(error);
		}
	};
}

function matchRoute(pathname: string): {
	number: number;
	route: { handler: Route; method: Method };
} {
	const staticRoute = STATIC_ROUTES[pathname];
	if (staticRoute) return { number: 0, route: staticRoute };
	const match = PULL_ROUTE_PATTERN.exec(pathname);
	const route = match?.[2] === undefined ? undefined : PULL_ROUTES[match[2]];
	if (!match?.[1] || !route) throw new ApiError(404, 'not-found', 'There is no such route.');
	const number = Number(match[1]);
	if (!Number.isSafeInteger(number) || number <= 0) {
		throw new ApiError(400, 'invalid', 'A pull request number is a positive integer.');
	}
	return { number, route };
}

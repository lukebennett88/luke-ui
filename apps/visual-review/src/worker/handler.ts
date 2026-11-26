import type { Context } from './access.js';
import { callback, login, logout, session } from './auth.js';
import type { Env } from './config.js';
import { readConfig } from './config.js';
import { decide } from './decide.js';
import { getReview } from './get-review.js';
import type { Deps } from './github.js';
import { createGitHubApp } from './github.js';
import { ApiError, errorResponse } from './http.js';
import { listPulls, PULLS_PATH } from './list-pulls.js';

/** The part of the Pages Functions execution context the worker uses. */
export interface ExecutionContext {
	waitUntil: (promise: Promise<unknown>) => void;
}

interface Route {
	handler: (context: Context) => Promise<Response> | Response;
	method: 'GET' | 'POST';
}

/** Stands for the pull request number in a route's path. */
const PULL_NUMBER_KEY = ':number';
const PULL_NUMBER_PATTERN = /^\/api\/pulls\/(\d+)\//;

/** Every route, by path. A pull request route's path has `:number` for its number. */
const ROUTES: Record<string, Route> = {
	'/api/auth/callback': { handler: callback, method: 'GET' },
	'/api/auth/login': { handler: login, method: 'GET' },
	'/api/auth/logout': { handler: logout, method: 'POST' },
	[PULLS_PATH]: { handler: listPulls, method: 'GET' },
	[`/api/pulls/${PULL_NUMBER_KEY}/decision`]: { handler: pullRoute(decide), method: 'POST' },
	[`/api/pulls/${PULL_NUMBER_KEY}/review`]: { handler: pullRoute(getReview), method: 'GET' },
	'/api/session': { handler: session, method: 'GET' },
};

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
		try {
			const config = readConfig(env);
			if (!config) {
				throw new ApiError(503, 'unconfigured', 'The review backend is not configured here.');
			}
			const route =
				ROUTES[url.pathname.replace(PULL_NUMBER_PATTERN, `/api/pulls/${PULL_NUMBER_KEY}/`)];
			if (!route) throw new ApiError(404, 'not-found', 'There is no such route.');
			if (request.method !== route.method) {
				return errorResponse(
					new ApiError(405, 'method-not-allowed', `Use ${route.method} for this route.`),
					{ headers: { Allow: route.method } },
				);
			}
			const waitUntil = (promise: Promise<unknown>) => executionContext?.waitUntil(promise);
			return await route.handler({ config, deps, github, request, url, waitUntil });
		} catch (error) {
			return errorResponse(error);
		}
	};
}

/** Adapts a pull request route, which also takes the number from its path. */
function pullRoute(
	handler: (context: Context, number: number) => Promise<Response>,
): Route['handler'] {
	return (context) => {
		const number = Number(PULL_NUMBER_PATTERN.exec(context.url.pathname)?.[1]);
		if (!Number.isSafeInteger(number) || number <= 0) {
			throw new ApiError(400, 'invalid', 'A pull request number is a positive integer.');
		}
		return handler(context, number);
	};
}

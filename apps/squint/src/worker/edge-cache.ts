import type { Context } from './access.js';
import { json } from './http.js';

/**
 * Answers a `GET` route from Cloudflare's edge cache, or builds its JSON body and caches the
 * response for `seconds`. The cache write finishes after the response, so it never delays it, and
 * a failed write only means the next request builds the body again. Browsers keep no copy, because
 * a decision purges only the edge's.
 */
export async function cachedJson(
	context: Context,
	path: string,
	seconds: number,
	build: () => Promise<unknown>,
): Promise<Response> {
	const { cache } = context.deps;
	const key = cacheKey(context, path);
	const cached = await cache?.match(key);
	if (cached) return cached;
	const response = json(await build(), { cacheControl: `public, max-age=0, s-maxage=${seconds}` });
	if (cache) context.waitUntil(cache.put(key, response.clone()).catch(() => undefined));
	return response;
}

/** Removes a cached response. It never rejects, because a stale entry expires on its own. */
export async function purgeCached(context: Context, path: string): Promise<void> {
	await context.deps.cache?.delete(cacheKey(context, path)).catch(() => undefined);
}

function cacheKey(context: Context, path: string): Request {
	return new Request(`${context.config.appOrigin}${path}`);
}

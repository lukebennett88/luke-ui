// The Pages Functions entry, built to `dist/_worker.js` by `vite.worker.config.ts`. Pages runs it
// in advanced mode for the `/api/*` routes in `dist/_routes.json`. Everything else is static.
import type { Env } from './config.js';
import type { ResponseCache } from './github.js';
import type { ExecutionContext } from './handler.js';
import { createHandler } from './handler.js';

/** Cloudflare's `caches`, which adds the zone's default cache to the standard `CacheStorage`. */
interface CloudflareCacheStorage {
	default?: ResponseCache;
}

let handle: ReturnType<typeof createHandler> | undefined;

export default {
	fetch(request: Request, env: Env, executionContext: ExecutionContext): Promise<Response> {
		// Created on the first request, and kept for the isolate's lifetime with its token cache.
		handle ??= createHandler({
			cache: (globalThis.caches as unknown as CloudflareCacheStorage | undefined)?.default,
			fetch: (input, init) => fetch(input, init),
			now: () => Date.now(),
		});
		return handle(request, env, executionContext);
	},
};

import { vi } from 'vite-plus/test';

type Handler = (init: RequestInit | undefined) => Response | Promise<Response>;

/** The browser tests' data URL template, `https://pr-{pr}.reports.test`, in `vite.config.ts`. */
const REPORTS_HOST_SUFFIX = '.reports.test';

/**
 * Replaces `fetch` for the review backend's `/api/*` routes and the pull request report origin.
 * Keys are `METHOD path`, such as `GET /api/session`. Anything else, such as the local report,
 * reaches the network. Returns the calls each route received.
 */
export function mockApi(routes: Record<string, Handler>) {
	const realFetch = globalThis.fetch;
	const calls: Array<{ body: unknown; headers: Headers; key: string }> = [];
	vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
		const url = new URL(input instanceof Request ? input.url : String(input), window.location.href);
		const key = `${init?.method ?? 'GET'} ${url.origin === window.location.origin ? url.pathname : url.href}`;
		const handler = routes[key];
		if (!handler) {
			if (url.pathname.startsWith('/api/')) return json({ error: 'not-found', message: '' }, 404);
			// An unpublished report, as Pages answers for a pull request with no deployment.
			if (url.hostname.endsWith(REPORTS_HOST_SUFFIX)) return new Response(null, { status: 404 });
			return realFetch(input, init);
		}
		calls.push({
			body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
			headers: new Headers(init?.headers),
			key,
		});
		return handler(init);
	});
	return calls;
}

export function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		headers: { 'Content-Type': 'application/json' },
		status,
	});
}

/** A pull request's published report: the committed fixture with `meta` for its comparison. */
export async function publishedReport(
	number: number,
	meta: { headSha: string; runAttempt: number; runId: number },
) {
	const response = await fetch('/__local-report/summary.json');
	const summary = (await response.json()) as Record<string, unknown>;
	return json({ ...summary, meta: { generatedAt: '', pullRequest: number, ...meta } });
}

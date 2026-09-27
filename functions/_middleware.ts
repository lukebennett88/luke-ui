/**
 * Cloudflare Pages adapter for `agent-negotiation.ts`'s host-agnostic logic. A
 * different host would need only a similarly small adapter of its own.
 * `apps/docs/public/_routes.json` excludes the paths this middleware skips.
 */
import { handleRequest, notFoundMarkdown } from '../apps/docs/src/lib/agent-negotiation.ts';

const MARKDOWN_EXTENSION_PATTERN = /\.md$/;

/** Minimal local shape of Cloudflare Pages' static asset binding. */
interface AssetsBinding {
	fetch: (input: Request | URL) => Promise<Response>;
}

/** Minimal local shape of Cloudflare Pages Functions' environment bindings. */
interface Env {
	ASSETS: AssetsBinding;
}

/** Minimal local shape of Cloudflare Pages Functions' `EventContext`. */
interface EventContext {
	env: Env;
	next: (request?: Request) => Promise<Response>;
	request: Request;
}

export const onRequest = async (context: EventContext): Promise<Response> => {
	const { env, request } = context;

	const res = await handleRequest(request, {
		fetch: (url) => fetchMarkdownAsset(url, env),
		next: (req) => (req ? context.next(req) : context.next()),
	});

	return applyMarkdownNotFoundFallback(request, res);
};

/**
 * Serves a Markdown twin from static assets, falling back to the `.md`
 * route's 404 body when it is missing (assets 404s are HTML, not Markdown).
 */
async function fetchMarkdownAsset(url: URL, env: Env): Promise<Response> {
	const res = await env.ASSETS.fetch(url);
	if (res.status !== 404) return res;

	return markdownNotFoundResponse(url, 'GET');
}

/**
 * A direct request for a missing `*.md` path passes through `handleRequest`
 * unchanged, so on Pages it resolves to the static `404.html` page. Reproduce
 * the `{$}.md` route's Markdown 404 for that case instead.
 */
function applyMarkdownNotFoundFallback(request: Request, res: Response): Response {
	const url = new URL(request.url);
	const isMarkdown = (res.headers.get('Content-Type') ?? '').startsWith('text/markdown');
	if (!url.pathname.endsWith('.md') || res.status !== 404 || isMarkdown) return res;

	return markdownNotFoundResponse(url, request.method);
}

/** The `.md` route's 404 body for `url`, using its origin for absolute links. */
function markdownNotFoundResponse(url: URL, method: string): Response {
	const pathname = url.pathname.replace(MARKDOWN_EXTENSION_PATTERN, '');
	return new Response(method === 'HEAD' ? null : notFoundMarkdown(pathname, url.origin), {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
		status: 404,
	});
}

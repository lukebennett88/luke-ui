/**
 * Pure request-negotiation logic for serving Markdown to agents. Host-agnostic:
 * it depends only on the standard `Request`/`Response`/`fetch` types, with the
 * request-forwarding (`next`) and Markdown-fetching (`fetch`) side effects
 * injected via `HandleRequestDeps`, so any host can drive it from a thin
 * adapter — see `netlify/edge-functions/agent-negotiation.ts` for the Netlify
 * one. Kept free of imports so an edge bundler can load it directly.
 */

const Q_VALUE_PATTERN = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/;
const TRAILING_SLASH_PATTERN = /\/$/;
const LAST_SEGMENT_PATTERN = /\/([^/]*)$/;

/**
 * True when the Accept header asks for Markdown at least as strongly as HTML.
 *
 * Markdown is opt-in: `text/markdown` must be listed explicitly with q > 0.
 * Wildcards never select it. HTML's q comes from the most specific range that
 * matches it, per RFC 9110 §12.5.1: `text/html`, then `text/*`, then the full
 * wildcard. It is 0 when none match. A tie goes to Markdown, because the
 * client named it explicitly. Parameters other than `q` are ignored, and a
 * range with an invalid q is skipped.
 */
export function prefersMarkdown(accept: string | null): boolean {
	if (!accept) return false;

	const ranges = parseAcceptHeader(accept);
	const markdownQ = ranges.get('text/markdown') ?? 0;
	const htmlQ = ranges.get('text/html') ?? ranges.get('text/*') ?? ranges.get('*/*') ?? 0;

	return markdownQ > 0 && markdownQ >= htmlQ;
}

/** Maps a request pathname to its Markdown twin. `/` becomes `/index.md`. */
export function markdownPathFor(pathname: string): string {
	if (pathname === '/') return '/index.md';
	const withoutTrailingSlash = pathname.replace(TRAILING_SLASH_PATTERN, '');
	return `${withoutTrailingSlash}.md`;
}

/**
 * Markdown body for a page that has no Markdown twin. Links are prefixed with
 * `origin`, or stay root-relative when it is empty.
 */
export function notFoundMarkdown(pathname: string, origin = ''): string {
	const lines = [
		'# Page not found',
		'',
		`There is no page at \`${pathname}\` on Luke UI.`,
		'',
		'Try one of these instead:',
		'',
		`- [llms.txt](${origin}/llms.txt)`,
		`- [Sitemap](${origin}/sitemap.xml)`,
		`- [Installation](${origin}/docs/installation)`,
		`- [Luke UI home](${origin}/)`,
		'',
	];
	return lines.join('\n');
}

interface HandleRequestDeps {
	fetch: (url: URL) => Promise<Response>;
	next: (request?: Request) => Promise<Response>;
}

const PASSTHROUGH_PREFIXES = ['/.well-known/', '/__tsr/'];

/** Negotiates Markdown vs. HTML for GET/HEAD requests to non-asset paths. */
export async function handleRequest(request: Request, deps: HandleRequestDeps): Promise<Response> {
	const url = new URL(request.url);
	const { pathname } = url;

	if (isPassthroughPath(pathname)) return deps.next();

	if (request.method !== 'GET' && request.method !== 'HEAD') return deps.next();

	const accept = request.headers.get('Accept');

	if (prefersMarkdown(accept)) return handleMarkdownRequest(request, url, deps);

	return withAcceptVary(await deps.next());
}

function isPassthroughPath(pathname: string): boolean {
	if (PASSTHROUGH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix)))
		return true;
	if (isApiPath(pathname)) return true;
	const lastSegment = LAST_SEGMENT_PATTERN.exec(pathname)?.[1] ?? pathname;
	return lastSegment.includes('.');
}

/** True for `/api` and any path under it, but not a sibling like `/apiary`. */
function isApiPath(pathname: string): boolean {
	return pathname === '/api' || pathname.startsWith('/api/');
}

async function handleMarkdownRequest(
	request: Request,
	url: URL,
	deps: HandleRequestDeps,
): Promise<Response> {
	const markdownUrl = new URL(markdownPathFor(url.pathname), request.url);
	const md = await deps.fetch(markdownUrl);
	const isMarkdown = (md.headers.get('Content-Type') ?? '').startsWith('text/markdown');

	if (md.status === 200 && isMarkdown) return markdownResponse(request.method, md, 200);

	// The deployed SSR handler 406s any request whose Accept isn't
	// HTML-compatible, so re-request with Accept: text/html before falling
	// through to it. That's the only way to see whether the path is a real
	// page (200/redirect, e.g. a page with no Markdown twin) or genuinely
	// missing (404).
	const htmlHeaders = new Headers(request.headers);
	htmlHeaders.set('Accept', 'text/html');
	const htmlRequest = new Request(request.url, { headers: htmlHeaders, method: request.method });

	const res = await deps.next(htmlRequest);
	if (res.status === 404) {
		// The `.md` route's own 404 body links to the site's public URL. Without
		// it, fall back to a body with root-relative links.
		if (md.status === 404 && isMarkdown) return markdownResponse(request.method, md, 404);

		return new Response(bodyForMethod(request.method, notFoundMarkdown(url.pathname)), {
			headers: {
				'Content-Type': 'text/markdown; charset=utf-8',
				Vary: 'Accept',
			},
			status: 404,
		});
	}

	return withAcceptVary(res);
}

/**
 * Re-serves a fetched Markdown response, keeping its caching headers.
 * `Content-Length` and `Content-Encoding` are dropped, since `fetch` may have
 * decoded the body.
 */
function markdownResponse(method: string, md: Response, status: number): Response {
	const headers = withMergedVary(md.headers, 'Accept');
	headers.delete('Content-Encoding');
	headers.delete('Content-Length');
	headers.set('Content-Type', 'text/markdown; charset=utf-8');
	return new Response(method === 'HEAD' ? null : md.body, { headers, status });
}

/** Passes `res` through with `Accept` merged into its `Vary` header. */
function withAcceptVary(res: Response): Response {
	return new Response(res.body, {
		headers: withMergedVary(res.headers, 'Accept'),
		status: res.status,
		statusText: res.statusText,
	});
}

function bodyForMethod(method: string, body: string): string | null {
	return method === 'HEAD' ? null : body;
}

/** Returns a copy of `source` with `name` merged into its `Vary` header. */
function withMergedVary(source: Headers, name: string): Headers {
	const existing = source.get('Vary');
	const values = existing ? existing.split(',').map((value) => value.trim()) : [];
	if (!values.some((value) => value.toLowerCase() === name.toLowerCase())) values.push(name);

	const headers = new Headers(source);
	headers.set('Vary', values.join(', '));
	return headers;
}

/**
 * Maps each lowercased media range (including wildcards) to its q-value. A
 * range listed more than once keeps its highest q.
 */
function parseAcceptHeader(accept: string): Map<string, number> {
	const ranges = new Map<string, number>();
	for (const part of accept.split(',')) {
		const [rawType, ...params] = part.split(';');
		const type = rawType?.trim().toLowerCase();
		if (!type) continue;

		const q = parseQuality(params);
		if (q === null) continue;

		ranges.set(type, Math.max(q, ranges.get(type) ?? 0));
	}
	return ranges;
}

/** The `q` parameter's value, 1 when absent, or null when it is invalid. */
function parseQuality(params: Array<string>): number | null {
	for (const param of params) {
		const [name, value] = param.split('=');
		if (name?.trim().toLowerCase() !== 'q') continue;

		const trimmed = value?.trim() ?? '';
		return Q_VALUE_PATTERN.test(trimmed) ? Number.parseFloat(trimmed) : null;
	}
	return 1;
}

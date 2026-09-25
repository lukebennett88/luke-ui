/**
 * Pure request-negotiation logic shared by the Netlify edge function that
 * serves Markdown to agents. Kept free of imports so Netlify's Deno edge
 * bundler can load it directly.
 */

const MEDIA_RANGE_PATTERN = /^([^;]+)(;.*)?$/;
const Q_PARAMETER_PATTERN = /;\s*q=([\d.]+)/i;
const TRAILING_SLASH_PATTERN = /\/$/;
const LAST_SEGMENT_PATTERN = /\/([^/]*)$/;

interface MediaRange {
	type: string;
	q: number;
}

/**
 * True when the Accept header explicitly prefers `text/markdown` over
 * `text/html` per RFC 9110 §12.5.1 media-range q-values. Wildcards never
 * trigger Markdown, and an explicit q=0 rules a type out.
 */
export function prefersMarkdown(accept: string | null): boolean {
	if (!accept) return false;

	const ranges = parseAcceptHeader(accept);
	const markdown = ranges.get('text/markdown');
	if (!markdown || markdown.q <= 0) return false;

	const html = ranges.get('text/html');
	if (!html) return true;

	return markdown.q >= html.q;
}

/** Maps a request pathname to its Markdown twin. `/` becomes `/index.md`. */
export function markdownPathFor(pathname: string): string {
	if (pathname === '/') return '/index.md';
	const withoutTrailingSlash = pathname.replace(TRAILING_SLASH_PATTERN, '');
	return `${withoutTrailingSlash}.md`;
}

/** Markdown body for a page that has no Markdown twin. */
export function notFoundMarkdown(origin: string, pathname: string): string {
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

const PASSTHROUGH_PREFIXES = ['/.well-known/', '/__tsr/', '/api'];

/** Negotiates Markdown vs. HTML for GET/HEAD requests to non-asset paths. */
export async function handleRequest(request: Request, deps: HandleRequestDeps): Promise<Response> {
	const url = new URL(request.url);
	const { pathname } = url;

	if (isPassthroughPath(pathname)) return deps.next();

	if (request.method !== 'GET' && request.method !== 'HEAD') return deps.next();

	const accept = request.headers.get('Accept');

	if (prefersMarkdown(accept)) return handleMarkdownRequest(request, url, deps);

	const res = await deps.next();
	return withMergedVary(res, 'Accept');
}

function isPassthroughPath(pathname: string): boolean {
	if (PASSTHROUGH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix)))
		return true;
	const lastSegment = LAST_SEGMENT_PATTERN.exec(pathname)?.[1] ?? pathname;
	return lastSegment.includes('.');
}

async function handleMarkdownRequest(
	request: Request,
	url: URL,
	deps: HandleRequestDeps,
): Promise<Response> {
	const markdownUrl = new URL(markdownPathFor(url.pathname), request.url);
	const md = await deps.fetch(markdownUrl);
	const mdContentType = md.headers.get('Content-Type') ?? '';

	if (md.status === 200 && mdContentType.startsWith('text/markdown')) {
		return new Response(bodyForMethod(request.method, await md.text()), {
			headers: {
				'Content-Type': 'text/markdown; charset=utf-8',
				Vary: 'Accept',
			},
			status: 200,
		});
	}

	// The SSR function 406s any request whose Accept isn't HTML-compatible, so
	// re-request with Accept: text/html before falling through to it. That's
	// the only way to see whether the path is a real page (200/redirect,
	// e.g. a page with no Markdown twin) or genuinely missing (404).
	const htmlHeaders = new Headers(request.headers);
	htmlHeaders.set('Accept', 'text/html');
	const htmlRequest = new Request(request.url, { headers: htmlHeaders, method: request.method });

	const res = await deps.next(htmlRequest);
	if (res.status === 404) {
		return new Response(bodyForMethod(request.method, notFoundMarkdown(url.origin, url.pathname)), {
			headers: {
				'Content-Type': 'text/markdown; charset=utf-8',
				Vary: 'Accept',
			},
			status: 404,
		});
	}

	return withMergedVary(res, 'Accept');
}

function bodyForMethod(method: string, body: string): string | null {
	return method === 'HEAD' ? null : body;
}

/** Returns a new response with `name` merged into its existing `Vary` header. */
function withMergedVary(res: Response, name: string): Response {
	const existing = res.headers.get('Vary');
	const values = existing ? existing.split(',').map((value) => value.trim()) : [];
	if (!values.some((value) => value.toLowerCase() === name.toLowerCase())) values.push(name);

	const headers = new Headers(res.headers);
	headers.set('Vary', values.join(', '));
	return new Response(res.body, { headers, status: res.status, statusText: res.statusText });
}

function parseAcceptHeader(accept: string): Map<string, MediaRange> {
	const ranges = new Map<string, MediaRange>();
	for (const part of accept.split(',')) {
		const trimmed = part.trim();
		if (!trimmed) continue;

		const match = MEDIA_RANGE_PATTERN.exec(trimmed);
		if (!match) continue;

		const type = match[1]?.trim().toLowerCase();
		if (!type || type.includes('*')) continue;

		const qMatch = match[2] ? Q_PARAMETER_PATTERN.exec(match[2]) : null;
		const q = qMatch?.[1] ? Number.parseFloat(qMatch[1]) : 1;
		ranges.set(type, { q, type });
	}
	return ranges;
}

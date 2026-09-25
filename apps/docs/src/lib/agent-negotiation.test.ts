import { expect, test, vi } from 'vite-plus/test';
import {
	handleRequest,
	markdownPathFor,
	notFoundMarkdown,
	prefersMarkdown,
} from './agent-negotiation.js';

const CHROME_ACCEPT =
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';
const FIREFOX_ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
const SAFARI_ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';

test.each<[accept: string | null, expected: boolean]>([
	['text/markdown', true],
	[null, false],
	['', false],
	['*/*', false],
	['text/*', false],
	['text/markdown, text/html;q=0.9', true],
	['text/html, text/markdown;q=0.5', false],
	['text/markdown;q=0.8, */*;q=1', false],
	['text/markdown;q=1, */*;q=0.8', true],
	['text/markdown;q=0.5, text/*;q=0.9', false],
	['text/markdown, text/*;q=0.9', true],
	['text/markdown;q=0.5, text/html;q=0, */*', true],
	['text/markdown;q=0', false],
	['text/markdown, text/html', true],
	['TEXT/Markdown; charset=utf-8', true],
	['text/markdown;charset=utf-8;q=0.5, text/html;q=0.4', true],
	['text/markdown;q=abc', false],
	['text/markdown;q=2', false],
	['text/markdown, text/html;q=nope', true],
	[CHROME_ACCEPT, false],
	[FIREFOX_ACCEPT, false],
	[SAFARI_ACCEPT, false],
])('prefersMarkdown(%j) is %s', (accept, expected) => {
	expect(prefersMarkdown(accept)).toBe(expected);
});

test('maps the homepage to /index.md', () => {
	expect(markdownPathFor('/')).toBe('/index.md');
});

test('maps a docs page, with or without a trailing slash, to its .md path', () => {
	expect(markdownPathFor('/docs/installation')).toBe('/docs/installation.md');
	expect(markdownPathFor('/docs/installation/')).toBe('/docs/installation.md');
});

test('builds a Markdown 404 body naming the missing path and linking elsewhere', () => {
	const body = notFoundMarkdown('/nope', 'https://example.com');
	expect(body).toContain('# Page not found');
	expect(body).toContain('`/nope`');
	expect(body).toContain('[llms.txt](https://example.com/llms.txt)');
});

test('builds root-relative 404 links when no origin is given', () => {
	const body = notFoundMarkdown('/nope');
	expect(body).toContain('[llms.txt](/llms.txt)');
	expect(body).toContain('[Luke UI home](/)');
});

test('serves the fetched Markdown twin for the homepage under a markdown Accept', async () => {
	const next = vi.fn<() => Promise<Response>>();
	const fetchMock = vi.fn<(url: URL) => Promise<Response>>(async () => {
		return new Response('# Luke UI\n', {
			headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
			status: 200,
		});
	});

	const request = new Request('https://luke-ui.netlify.app/', {
		headers: { Accept: 'text/markdown' },
	});
	const res = await handleRequest(request, { fetch: fetchMock, next });

	expect(next).not.toHaveBeenCalled();
	expect(fetchMock).toHaveBeenCalledWith(new URL('https://luke-ui.netlify.app/index.md'));
	expect(res.status).toBe(200);
	expect(res.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
	expect(res.headers.get('Vary')).toBe('Accept');
	expect(await res.text()).toBe('# Luke UI\n');
});

test("keeps the Markdown twin's caching headers and drops stale encoding headers", async () => {
	const next = vi.fn<() => Promise<Response>>();
	const fetchMock = vi.fn<(url: URL) => Promise<Response>>(async () => {
		return new Response('# Installation\n', {
			headers: {
				'Cache-Control': 'public, max-age=0, must-revalidate',
				'Content-Encoding': 'br',
				'Content-Length': '999',
				'Content-Type': 'text/markdown',
				ETag: '"abc"',
				Vary: 'Accept-Encoding',
			},
			status: 200,
		});
	});

	const request = new Request('https://example.com/docs/installation', {
		headers: { Accept: 'text/markdown' },
	});
	const res = await handleRequest(request, { fetch: fetchMock, next });

	expect(res.status).toBe(200);
	expect(res.headers.get('Cache-Control')).toBe('public, max-age=0, must-revalidate');
	expect(res.headers.get('ETag')).toBe('"abc"');
	expect(res.headers.get('Vary')).toBe('Accept-Encoding, Accept');
	expect(res.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
	expect(res.headers.get('Content-Length')).toBeNull();
	expect(res.headers.get('Content-Encoding')).toBeNull();
	expect(await res.text()).toBe('# Installation\n');
});

test('passes a browser Accept header through and merges Vary', async () => {
	const next = vi.fn<() => Promise<Response>>(async () => {
		return new Response('<html></html>', {
			headers: { 'Content-Type': 'text/html', Vary: 'Accept-Encoding' },
			status: 200,
		});
	});
	const fetchMock = vi.fn<(url: URL) => Promise<Response>>();

	const request = new Request('https://luke-ui.netlify.app/', {
		headers: { Accept: 'text/html,application/xhtml+xml,*/*;q=0.8' },
	});
	const res = await handleRequest(request, { fetch: fetchMock, next });

	expect(fetchMock).not.toHaveBeenCalled();
	expect(res.headers.get('Vary')).toBe('Accept-Encoding, Accept');
	expect(await res.text()).toBe('<html></html>');
});

/**
 * Simulates Netlify's SSR function, which 406s any request whose Accept
 * isn't HTML-compatible. `next` is called with no request when the edge
 * function passes the original request through unmodified, so that case
 * checks the request's own Accept header instead.
 */
function makeRealisticNext(originalAccept: string) {
	return vi.fn<(request?: Request) => Promise<Response>>(async (request) => {
		const accept = request ? request.headers.get('Accept') : originalAccept;
		if (!accept || !(accept.includes('text/html') || accept.includes('*/*'))) {
			return new Response(JSON.stringify({ error: 'Only HTML requests are supported here' }), {
				headers: { 'Content-Type': 'application/json' },
				status: 406,
			});
		}
		return new Response('Not found', { headers: { 'Content-Type': 'text/html' }, status: 404 });
	});
}

test("returns the .md route's own Markdown 404 body when the page is missing", async () => {
	const next = makeRealisticNext('text/markdown');
	const fetchMock = vi.fn<(url: URL) => Promise<Response>>(async () => {
		return new Response('# Page not found\n\n[llms.txt](https://example.com/llms.txt)\n', {
			headers: {
				'Cache-Control': 'public, max-age=60',
				'Content-Length': '999',
				'Content-Type': 'text/markdown; charset=utf-8',
				ETag: '"missing"',
			},
			status: 404,
		});
	});

	const request = new Request('https://example.com/nope', {
		headers: { Accept: 'text/markdown' },
	});
	const res = await handleRequest(request, { fetch: fetchMock, next });

	expect(next).toHaveBeenCalledOnce();
	expect(next.mock.calls[0]?.[0]?.headers.get('Accept')).toBe('text/html');
	expect(res.status).toBe(404);
	expect(res.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
	expect(res.headers.get('Vary')).toBe('Accept');
	expect(res.headers.get('Cache-Control')).toBe('public, max-age=60');
	expect(res.headers.get('ETag')).toBe('"missing"');
	expect(res.headers.get('Content-Length')).toBeNull();
	expect(await res.text()).toBe('# Page not found\n\n[llms.txt](https://example.com/llms.txt)\n');
});

test('builds a root-relative Markdown 404 body when the .md route returns no Markdown', async () => {
	const next = makeRealisticNext('text/markdown');
	const fetchMock = vi.fn<(url: URL) => Promise<Response>>(
		async () => new Response('Not found', { status: 404 }),
	);

	const request = new Request('https://example.com/nope', {
		headers: { Accept: 'text/markdown' },
	});
	const res = await handleRequest(request, { fetch: fetchMock, next });

	expect(next).toHaveBeenCalledOnce();
	expect(next.mock.calls[0]?.[0]?.headers.get('Accept')).toBe('text/html');
	expect(res.status).toBe(404);
	expect(res.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
	expect(res.headers.get('Vary')).toBe('Accept');
	expect(await res.text()).toBe(notFoundMarkdown('/nope'));
});

test('serves an empty Markdown 404 body for a HEAD request', async () => {
	const next = makeRealisticNext('text/markdown');
	const fetchMock = vi.fn<(url: URL) => Promise<Response>>(async () => {
		return new Response('# Page not found\n', {
			headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
			status: 404,
		});
	});

	const request = new Request('https://example.com/nope', {
		headers: { Accept: 'text/markdown' },
		method: 'HEAD',
	});
	const res = await handleRequest(request, { fetch: fetchMock, next });

	expect(res.status).toBe(404);
	expect(res.body).toBeNull();
});

test('falls back to HTML with merged Vary when the path has no Markdown twin but the page exists', async () => {
	const next = vi.fn<(request?: Request) => Promise<Response>>(async () => {
		return new Response('<html>ok</html>', {
			headers: { 'Content-Type': 'text/html' },
			status: 200,
		});
	});
	const fetchMock = vi.fn<(url: URL) => Promise<Response>>(
		async () => new Response('Not found', { status: 404 }),
	);

	const request = new Request('https://luke-ui.netlify.app/playground', {
		headers: { Accept: 'text/markdown' },
	});
	const res = await handleRequest(request, { fetch: fetchMock, next });

	expect(next).toHaveBeenCalledOnce();
	const requestSeenByNext = next.mock.calls[0]?.[0];
	expect(requestSeenByNext?.headers.get('Accept')).toBe('text/html');
	expect(res.status).toBe(200);
	expect(res.headers.get('Content-Type')).toBe('text/html');
	expect(res.headers.get('Vary')).toBe('Accept');
});

test('passes through an asset path unchanged', async () => {
	const next = vi.fn<() => Promise<Response>>(async () => new Response('/* css */'));
	const fetchMock = vi.fn<(url: URL) => Promise<Response>>();

	const request = new Request('https://luke-ui.netlify.app/assets/x.js');
	await handleRequest(request, { fetch: fetchMock, next });

	expect(next).toHaveBeenCalledOnce();
	expect(fetchMock).not.toHaveBeenCalled();
});

test('passes through an already-Markdown request unchanged', async () => {
	const next = vi.fn<() => Promise<Response>>(async () => new Response('# Doc'));
	const fetchMock = vi.fn<(url: URL) => Promise<Response>>();

	const request = new Request('https://luke-ui.netlify.app/index.md');
	await handleRequest(request, { fetch: fetchMock, next });

	expect(next).toHaveBeenCalledOnce();
	expect(fetchMock).not.toHaveBeenCalled();
});

test.each(['/api', '/api/search'])(
	'passes through %s unchanged, regardless of Accept',
	async (pathname) => {
		const apiResponse = new Response('{}', { headers: { 'Content-Type': 'application/json' } });
		const next = vi.fn<() => Promise<Response>>(async () => apiResponse);
		const fetchMock = vi.fn<(url: URL) => Promise<Response>>();

		const request = new Request(`https://luke-ui.netlify.app${pathname}`, {
			headers: { Accept: 'text/markdown' },
		});
		const res = await handleRequest(request, { fetch: fetchMock, next });

		expect(next).toHaveBeenCalledOnce();
		expect(fetchMock).not.toHaveBeenCalled();
		expect(res).toBe(apiResponse);
		expect(res.headers.get('Vary')).toBeNull();
	},
);

test('negotiates Markdown for /apiary, a sibling path that merely starts with "api"', async () => {
	const next = vi.fn<(request?: Request) => Promise<Response>>();
	const fetchMock = vi.fn<(url: URL) => Promise<Response>>(async () => {
		return new Response('# Apiary\n', {
			headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
			status: 200,
		});
	});

	const request = new Request('https://luke-ui.netlify.app/apiary', {
		headers: { Accept: 'text/markdown' },
	});
	const res = await handleRequest(request, { fetch: fetchMock, next });

	expect(fetchMock).toHaveBeenCalledWith(new URL('https://luke-ui.netlify.app/apiary.md'));
	expect(next).not.toHaveBeenCalled();
	expect(res.status).toBe(200);
});

test('passes /apiary through to next with a merged Vary under a browser Accept header', async () => {
	const next = vi.fn<() => Promise<Response>>(async () => {
		return new Response('<html></html>', {
			headers: { 'Content-Type': 'text/html' },
			status: 200,
		});
	});
	const fetchMock = vi.fn<(url: URL) => Promise<Response>>();

	const request = new Request('https://luke-ui.netlify.app/apiary', {
		headers: { Accept: 'text/html,application/xhtml+xml,*/*;q=0.8' },
	});
	const res = await handleRequest(request, { fetch: fetchMock, next });

	expect(fetchMock).not.toHaveBeenCalled();
	expect(next).toHaveBeenCalledOnce();
	expect(res.headers.get('Vary')).toBe('Accept');
});

test('serves an empty body for a HEAD request', async () => {
	const next = vi.fn<() => Promise<Response>>(async () => {
		return new Response('# Luke UI\n', {
			headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
			status: 200,
		});
	});
	const fetchMock = vi.fn<(url: URL) => Promise<Response>>(async () => {
		return new Response('# Luke UI\n', {
			headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
			status: 200,
		});
	});

	const request = new Request('https://luke-ui.netlify.app/', {
		headers: { Accept: 'text/markdown' },
		method: 'HEAD',
	});
	const res = await handleRequest(request, { fetch: fetchMock, next });

	expect(res.status).toBe(200);
	expect(res.body).toBeNull();
});

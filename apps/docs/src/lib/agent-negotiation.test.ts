import { expect, test, vi } from 'vite-plus/test';
import {
	handleRequest,
	markdownPathFor,
	notFoundMarkdown,
	prefersMarkdown,
} from './agent-negotiation.js';

test('accepts an unqualified text/markdown', () => {
	expect(prefersMarkdown('text/markdown')).toBe(true);
});

test('accepts markdown ranked above a lower-quality html', () => {
	expect(prefersMarkdown('text/markdown, text/html;q=0.9')).toBe(true);
});

test('rejects a browser Accept header with a markdown-less wildcard tail', () => {
	expect(prefersMarkdown('text/html,application/xhtml+xml,*/*;q=0.8')).toBe(false);
});

test('rejects markdown ranked below html', () => {
	expect(prefersMarkdown('text/html, text/markdown;q=0.5')).toBe(false);
});

test('rejects markdown explicitly disabled with q=0', () => {
	expect(prefersMarkdown('text/markdown;q=0')).toBe(false);
});

test('rejects a bare wildcard', () => {
	expect(prefersMarkdown('*/*')).toBe(false);
});

test('rejects a missing Accept header', () => {
	expect(prefersMarkdown(null)).toBe(false);
});

test('maps the homepage to /index.md', () => {
	expect(markdownPathFor('/')).toBe('/index.md');
});

test('maps a docs page, with or without a trailing slash, to its .md path', () => {
	expect(markdownPathFor('/docs/installation')).toBe('/docs/installation.md');
	expect(markdownPathFor('/docs/installation/')).toBe('/docs/installation.md');
});

test('builds a Markdown 404 body naming the missing path and linking elsewhere', () => {
	const body = notFoundMarkdown('https://luke-ui.netlify.app', '/nope');
	expect(body.length).toBeGreaterThan(20);
	expect(body).toContain('/nope');
	expect(body).toContain('https://luke-ui.netlify.app/llms.txt');
	expect(body).toContain('# Page not found');
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

test('returns a Markdown 404 body when a markdown request has no matching page', async () => {
	const next = vi.fn<() => Promise<Response>>(
		async () => new Response('Not found', { status: 404 }),
	);
	const fetchMock = vi.fn<(url: URL) => Promise<Response>>(
		async () => new Response('Not found', { status: 404 }),
	);

	const request = new Request('https://luke-ui.netlify.app/nope', {
		headers: { Accept: 'text/markdown' },
	});
	const res = await handleRequest(request, { fetch: fetchMock, next });

	expect(res.status).toBe(404);
	expect(res.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
	const body = await res.text();
	expect(body.length).toBeGreaterThanOrEqual(20);
	expect(body).toContain('/llms.txt');
});

test('falls back to HTML with merged Vary when the path has no Markdown twin but the page exists', async () => {
	const next = vi.fn<() => Promise<Response>>(async () => {
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

test('passes through /api/* unchanged, regardless of Accept', async () => {
	const apiResponse = new Response('{}', { headers: { 'Content-Type': 'application/json' } });
	const next = vi.fn<() => Promise<Response>>(async () => apiResponse);
	const fetchMock = vi.fn<(url: URL) => Promise<Response>>();

	const request = new Request('https://luke-ui.netlify.app/api/search', {
		headers: { Accept: 'text/markdown' },
	});
	const res = await handleRequest(request, { fetch: fetchMock, next });

	expect(next).toHaveBeenCalledOnce();
	expect(fetchMock).not.toHaveBeenCalled();
	expect(res).toBe(apiResponse);
	expect(res.headers.get('Vary')).toBeNull();
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

	expect(await res.text()).toBe('');
});

import { expect, test } from 'vite-plus/test';
import { notFoundMarkdown } from './agent-negotiation.js';
import { resolveSiteUrl } from './resolve-site-url.js';

test('keeps a root deployment at the origin', () => {
	expect(resolveSiteUrl('https://ui.lukebennett.dev')).toBe('https://ui.lukebennett.dev');
	expect(resolveSiteUrl('https://ui.lukebennett.dev/', '/')).toBe('https://ui.lukebennett.dev');
});

test('appends a subpath base without a trailing slash', () => {
	expect(resolveSiteUrl('https://example.com', '/luke-ui/')).toBe('https://example.com/luke-ui');
	expect(resolveSiteUrl('https://example.com/', '/luke-ui/')).toBe('https://example.com/luke-ui');
});

test('Markdown 404 links include the configured base path', () => {
	const site = resolveSiteUrl('https://example.com', '/luke-ui/');
	const body = notFoundMarkdown('/missing', site);
	expect(body).toContain('[llms.txt](https://example.com/luke-ui/llms.txt)');
	expect(body).toContain('[Sitemap](https://example.com/luke-ui/sitemap.xml)');
	expect(body).toContain('[Installation](https://example.com/luke-ui/docs/installation)');
	expect(body).toContain('[Luke UI home](https://example.com/luke-ui/)');
});

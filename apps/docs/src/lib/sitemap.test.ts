import { expect, test } from 'vite-plus/test';
import { buildSitemap } from './sitemap.js';

test('uses the sitemaps.org 0.9 namespace', () => {
	const xml = buildSitemap('https://luke-ui.netlify.app', []);
	expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
	expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
});

test('lists absolute, trailing-slash locs for non-root pages, and no trailing slash for the homepage', () => {
	const xml = buildSitemap('https://luke-ui.netlify.app', [
		{ url: '/' },
		{ url: '/docs/installation' },
	]);
	expect(xml).toContain('<loc>https://luke-ui.netlify.app/</loc>');
	expect(xml).toContain('<loc>https://luke-ui.netlify.app/docs/installation/</loc>');
});

test('escapes XML-significant characters in a loc', () => {
	const xml = buildSitemap('https://luke-ui.netlify.app', [{ url: "/a&b'c" }]);
	expect(xml).toContain('<loc>https://luke-ui.netlify.app/a&amp;b&apos;c/</loc>');
});

test('includes lastmod only when the page has a known last-modified date', () => {
	const known = new Date('2026-01-01T00:00:00.000Z');
	const xml = buildSitemap('https://luke-ui.netlify.app', [
		{ lastModified: known, url: '/docs/installation' },
		{ url: '/components' },
	]);

	expect(xml).toContain('<lastmod>2026-01-01T00:00:00.000Z</lastmod>');
	const componentsEntry = xml.split('<url>').find((entry) => entry.includes('/components/'));
	expect(componentsEntry).toBeDefined();
	expect(componentsEntry).not.toContain('<lastmod>');
});

import { createFileRoute } from '@tanstack/react-router';
import { siteUrl } from '../lib/site-url.js';
import { buildSitemap } from '../lib/sitemap.js';
import { source } from '../lib/source';

export const Route = createFileRoute('/sitemap.xml')({
	server: {
		handlers: {
			GET: () => {
				const origin = siteUrl();
				const pages = [
					{ url: '/' },
					{ url: '/playground' },
					...source.getPages().map((page) => ({ url: page.url })),
				];

				return new Response(buildSitemap(origin, pages), {
					headers: { 'Content-Type': 'application/xml; charset=utf-8' },
				});
			},
		},
	},
});

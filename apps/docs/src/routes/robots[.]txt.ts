import { createFileRoute } from '@tanstack/react-router';
import { siteUrl } from '../lib/site-url.js';

export const Route = createFileRoute('/robots.txt')({
	server: {
		handlers: {
			GET: () => {
				const body = `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl()}/sitemap.xml\n`;
				return new Response(body, {
					headers: { 'Content-Type': 'text/plain; charset=utf-8' },
				});
			},
		},
	},
});

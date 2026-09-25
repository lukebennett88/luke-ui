import { createFileRoute } from '@tanstack/react-router';
import { notFoundMarkdown } from '../lib/agent-negotiation.js';
import { getLLMText } from '../lib/get-llm-text';
import { homeMarkdown } from '../lib/home-content';
import { slugsFromMarkdownRequest } from '../lib/markdown-page-path.js';
import { siteUrl } from '../lib/site-url.js';
import { source } from '../lib/source';

export const Route = createFileRoute('/{$}.md')({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const splat = params._splat ?? '';
				if (splat === 'index') {
					return new Response(homeMarkdown(), {
						headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
					});
				}

				const page = source.getPage(slugsFromMarkdownRequest(splat));
				if (!page) {
					return new Response(notFoundMarkdown(siteUrl(), `/${splat}`), {
						headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
						status: 404,
					});
				}

				return new Response(await getLLMText(page), {
					headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
				});
			},
		},
	},
});

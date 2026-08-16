import { createFileRoute, notFound } from '@tanstack/react-router';
import { getLLMText } from '../lib/get-llm-text';
import { slugsFromMarkdownRequest } from '../lib/markdown-page-path.js';
import { source } from '../lib/source';

export const Route = createFileRoute('/{$}.md')({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const page = source.getPage(slugsFromMarkdownRequest(params._splat ?? ''));
				if (!page) throw notFound();

				return new Response(await getLLMText(page), {
					headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
				});
			},
		},
	},
});

import { createFileRoute, notFound } from '@tanstack/react-router';
import { getLLMText } from '../lib/get-llm-text';
import { source } from '../lib/source';

export const Route = createFileRoute('/{$}.md')({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const slugs = (params._splat ?? '').split('/').filter(Boolean);
				const page = source.getPage(slugs.length === 1 && slugs[0] === 'index' ? [] : slugs);
				if (!page) throw notFound();

				return new Response(await getLLMText(page), {
					headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
				});
			},
		},
	},
});

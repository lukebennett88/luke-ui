import { createFileRoute, notFound } from '@tanstack/react-router';
import { getLLMText } from '../../../lib/get-llm-text';
import { source } from '../../../lib/source';

export const Route = createFileRoute('/llms.mdx/docs/$')({
	server: {
		handlers: {
			GET: async ({ params }) => {
				// Splat captures e.g. `index.md`, `getting-started.md`, or
				// `components/actions/button.md`. We require the trailing `.md` so the
				// prerendered file gets a markdown extension on disk and is served as
				// text/plain by static hosts. The docs index lives at `index.md`.
				const splat = params._splat ?? '';
				if (!splat.endsWith('.md')) throw notFound();
				const segments = splat.slice(0, -3).split('/').filter(Boolean);
				const slugs = segments.length === 1 && segments[0] === 'index' ? [] : segments;

				const page = source.getPage(slugs);
				if (!page) throw notFound();

				return new Response(await getLLMText(page), {
					headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
				});
			},
		},
	},
});

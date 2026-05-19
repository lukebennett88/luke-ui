import { packageDocs } from 'virtual:package-docs';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { getLLMText } from '../../lib/get-llm-text';
import { internalSegmentsToSourceSlugs } from '../../lib/markdown-url';
import { source } from '../../lib/source';

// Internal route used to prerender the public Markdown files.
export const Route = createFileRoute('/llms.mdx/$')({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const segments = (params._splat ?? '').split('/').filter(Boolean);
				const lastSegment = segments.at(-1) ?? '';
				const markdown = packageDocs[lastSegment];
				if (markdown) {
					return new Response(markdown, {
						headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
					});
				}

				const slugs = internalSegmentsToSourceSlugs(segments);
				const page = source.getPage(slugs);
				if (!page) throw notFound();

				return new Response(await getLLMText(page), {
					headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
				});
			},
		},
	},
});

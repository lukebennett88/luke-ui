import { discoverExports } from '@luke-ui/docs-tools/discover-exports';
import { renderIndex } from '@luke-ui/docs-tools/render-index';
import { createFileRoute } from '@tanstack/react-router';
import packageJson from '../../../../packages/@luke-ui/react/package.json' with { type: 'json' };
import { toPublic } from '../lib/markdown-url';
import { source } from '../lib/source';

export const Route = createFileRoute('/llms.txt')({
	server: {
		handlers: {
			GET: () => {
				const entries = discoverExports(packageJson.exports);
				const pageHrefBySlug = new Map(
					source.getPages().map((page) => [page.slugs.at(-1), `.${page.url}.md`]),
				);
				const entriesWithHref = entries.map((entry) => {
					return Object.assign(entry, {
						href:
							entry.shape === 'barrel'
								? `.${toPublic(entry.slug)}`
								: (pageHrefBySlug.get(entry.slug) ?? `./${entry.slug}.md`),
					});
				});

				const txt = renderIndex({
					entries: entriesWithHref,
					includeLibraryAuthors: false,
					packageName: packageJson.name,
				});
				return new Response(txt, {
					headers: { 'Content-Type': 'text/plain; charset=utf-8' },
				});
			},
		},
	},
});

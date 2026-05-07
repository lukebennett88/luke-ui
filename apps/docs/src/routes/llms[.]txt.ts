import { createFileRoute } from '@tanstack/react-router';
import { source } from '../lib/source';

export const Route = createFileRoute('/llms.txt')({
	server: {
		handlers: {
			GET: () => {
				const lines = ['# Luke UI Docs', '', '> Documentation for the @luke-ui/react package.', ''];

				for (const page of source.getPages()) {
					const description = page.data.description ? `: ${page.data.description}` : '';
					lines.push(`- [${page.data.title}](${page.url})${description}`);
				}

				return new Response(`${lines.join('\n')}\n`, {
					headers: { 'Content-Type': 'text/plain; charset=utf-8' },
				});
			},
		},
	},
});

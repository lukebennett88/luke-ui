import { createFileRoute } from '@tanstack/react-router';
import packageJson from '../../../../packages/@luke-ui/react/package.json' with { type: 'json' };
import { discoverExports } from '../../../../packages/@luke-ui/react/scripts/lib/discover-exports.js';
import { renderIndex } from '../../../../packages/@luke-ui/react/scripts/lib/render-index.js';

export const Route = createFileRoute('/llms.txt')({
	server: {
		handlers: {
			GET: () => {
				const entries = discoverExports(packageJson.exports);
				const txt = renderIndex({
					packageName: packageJson.name,
					pitch: 'A React design system built on react-aria-components and vanilla-extract.',
					entries,
					includeLibraryAuthors: false,
				});
				return new Response(txt, {
					headers: { 'Content-Type': 'text/plain; charset=utf-8' },
				});
			},
		},
	},
});

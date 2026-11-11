import { createFileRoute } from '@tanstack/react-router';
import { resolvePageHeadMeta } from '../../lib/page-head.js';
import { siteUrl } from '../../lib/site-url.js';
import { Playground } from '../../playground/playground-page.js';

export const Route = createFileRoute('/playground/')({
	component: Playground,
	head: () => {
		const url = `${siteUrl()}/playground/`;
		return {
			links: [{ href: url, rel: 'canonical' }],
			meta: resolvePageHeadMeta({
				title: 'Playground | Luke UI',
				description: 'Edit and preview Luke UI components in the browser.',
				url,
			}),
		};
	},
});

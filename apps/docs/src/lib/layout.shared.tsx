import type { DocsLayoutProps } from 'fumadocs-ui/layouts/notebook';
import { DocsSiteNav } from '../components/docs-site-nav.js';
import { siteDestinations } from './site-destinations.js';

export function baseOptions(): Omit<DocsLayoutProps, 'tree'> {
	return {
		links: siteDestinations.map((destination) => ({
			external: destination.isExternal ?? false,
			text: destination.label,
			url: destination.url,
		})),
		nav: {
			mode: 'top',
		},
		slots: {
			header: DocsSiteNav,
			themeSwitch: false,
		},
	};
}

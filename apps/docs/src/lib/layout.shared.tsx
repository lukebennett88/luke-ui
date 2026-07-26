import type { DocsLayoutProps } from 'fumadocs-ui/layouts/notebook';
import { DocsSiteNav } from '../components/docs-site-nav.js';
import { siteDestinations } from './site-destinations.js';

export function baseOptions(): Omit<DocsLayoutProps, 'tree'> {
	return {
		// Drives the sidebar and its mobile drawer, which list the destinations
		// below `lg` — the widths where the nav hands them off (see `SiteNav`).
		links: siteDestinations.map((destination) => ({
			external: destination.isExternal ?? false,
			text: destination.label,
			url: destination.url,
		})),
		// `top` spans the header across the full width and starts the sidebar
		// below it, so the shared nav is the outermost chrome on the page.
		nav: {
			mode: 'top',
		},
		slots: {
			header: DocsSiteNav,
			// The nav owns the appearance controls now, so the sidebar footer no
			// longer renders them.
			themeSwitch: false,
		},
	};
}

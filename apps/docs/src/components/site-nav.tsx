import { Button } from '@luke-ui/react/button';
import { IconLink } from '@luke-ui/react/icon-link';
import { rootClassName } from '@luke-ui/react/theme';
import { cx } from '@luke-ui/react/utils';
import { useLinkProps, useRouterState } from '@tanstack/react-router';
import type { ComponentProps } from 'react';
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Popover } from 'react-aria-components/Popover';
import { GITHUB_REPO_URL } from '../lib/github.js';
import { getActiveSiteDestination, siteDestinations } from '../lib/site-destinations.js';
import { DocsLink } from './docs-link.js';
import { GithubMark } from './github-mark.js';
import { DocsSearchTrigger } from './search.js';
import * as styles from './site-nav.css.js';
import { ThemeControls } from './theme-controls.js';

interface SiteNavProps extends ComponentProps<'header'> {
	hasSidebarNavigation?: boolean;
	hideActiveDestination?: boolean;
}

export function SiteNav({
	children,
	className,
	hasSidebarNavigation = false,
	hideActiveDestination = false,
	...props
}: SiteNavProps) {
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const activeDestination = hideActiveDestination ? undefined : getActiveSiteDestination(pathname);

	return (
		<header {...props} className={cx(styles.header, className)}>
			<SiteWordmark />
			<nav
				aria-label="Site"
				className={cx(styles.destinations, hasSidebarNavigation && styles.destinationsWithSidebar)}
			>
				{siteDestinations.map((destination) => (
					<DestinationLink
						destination={destination}
						isActive={destination === activeDestination}
						key={destination.url}
					/>
				))}
			</nav>
			<div className={styles.actions}>
				<div className={styles.wideSearch}>
					<DocsSearchTrigger />
				</div>
				<div className={styles.compactSearch}>
					<DocsSearchTrigger isCompact />
				</div>
				<div className={styles.desktopTheme}>
					<ThemeControls />
				</div>
				<AppearancePopover />
				<RepositoryLink />
				{children}
			</div>
		</header>
	);
}

function DestinationLink({
	destination,
	isActive,
}: {
	destination: (typeof siteDestinations)[number];
	isActive: boolean;
}) {
	// Docs points at `/docs/installation` but must stay current for every `/docs/*` page.
	// TanStack's exact active state alone cannot express that section-level rule.
	return (
		<DocsLink
			activeOptions={{ exact: true }}
			aria-current={isActive ? 'page' : undefined}
			className={cx(styles.destination, isActive && styles.activeDestination)}
			to={destination.url}
		>
			{destination.label}
		</DocsLink>
	);
}

// TanStack's `useLinkProps` returns DOM event handlers that RAC's `Link` cannot accept, so the
// wordmark stays a raw `<a>`. It also overrides `aria-current`: TanStack marks the home route as
// current, while the other destinations use custom matching.
function SiteWordmark() {
	const linkProps = useLinkProps({ to: '/' });
	return (
		<a {...linkProps} aria-current={undefined} className={styles.wordmark} data-status={undefined}>
			Luke UI
		</a>
	);
}

function AppearancePopover() {
	return (
		<DialogTrigger>
			<Button className={styles.mobileThemeTrigger} prominence="low" size="small">
				Theme
			</Button>
			<Popover className={cx(rootClassName, styles.appearancePopover)} placement="bottom end">
				<Dialog aria-label="Appearance" className={styles.appearanceDialog}>
					<ThemeControls />
				</Dialog>
			</Popover>
		</DialogTrigger>
	);
}

function RepositoryLink() {
	return (
		<IconLink
			aria-label="GitHub repository"
			href={GITHUB_REPO_URL}
			icon={<GithubMark />}
			prominence="low"
			rel="noreferrer noopener"
			size="small"
			target="_blank"
		/>
	);
}

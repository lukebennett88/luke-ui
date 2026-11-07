import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { IconButton } from '@luke-ui/react/icon-button';
import { IconLink } from '@luke-ui/react/icon-link';
import { cx } from '@luke-ui/react/utils';
import { useLinkProps, useRouterState } from '@tanstack/react-router';
import type { Root } from 'fumadocs-core/page-tree';
import { useSyncExternalStore } from 'react';
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Popover } from 'react-aria-components/Popover';
import { SITE_HEADER_ID } from '../lib/docs-container-queries.js';
import { GITHUB_REPO_URL } from '../lib/github.js';
import {
	getIsSidebarCollapsedSnapshot,
	getServerIsSidebarCollapsedSnapshot,
	subscribeToSidebarPref,
	writeIsSidebarCollapsed,
} from '../lib/sidebar-prefs.js';
import { getActiveSiteDestination, siteDestinations } from '../lib/site-destinations.js';
import { DocsLink } from './docs-link.js';
import { GithubMark } from './github-mark.js';
import { DocsSearchTrigger } from './search.js';
import { SidebarIcon } from './sidebar-icon.js';
import { SiteDrawer } from './site-drawer.js';
import * as styles from './site-header.css.js';
import { ThemeControls } from './theme-controls.js';

/** The `id` of the docs sidebar, which the sidebar toggle controls. */
export const DOCS_SIDEBAR_ID = 'docs-sidebar';

interface SiteHeaderProps {
	/** Placed in a grid or flex parent, such as the docs shell. */
	className?: string;
	/** Leaves every destination inactive, for a page that belongs to none, such as the 404 page. */
	hideActiveDestination?: boolean;
	/**
	 * The navigation tree of a page with a docs sidebar. Passing it adds the sidebar toggle and puts
	 * the tree in the drawer.
	 */
	tree?: Root;
}

/**
 * The header every page shares, on the page chrome. It is the `site-header` container. A desktop
 * row holds the wordmark, the sidebar toggle when there is a tree, and the destinations, then
 * search, Theme and GitHub. A compact row holds the wordmark, search, Theme and Menu.
 */
export function SiteHeader({ className, hideActiveDestination = false, tree }: SiteHeaderProps) {
	return (
		<Box
			backgroundColor="surface.subdued"
			className={cx(styles.header, className)}
			elementType="header"
			id={SITE_HEADER_ID}
		>
			<div className={styles.row} data-site-header-row="">
				<div className={styles.start}>
					<SiteWordmark />
					{tree ? <SidebarToggle /> : null}
					<SiteDestinations hideActiveDestination={hideActiveDestination} />
				</div>
				<div className={styles.actions}>
					<DocsSearchTrigger className={styles.transitionItem.search} isCompact />
					<AppearancePopover />
					<IconLink
						aria-label="GitHub repository"
						className={cx(styles.desktopOnly, styles.transitionItem.github)}
						href={GITHUB_REPO_URL}
						icon={<GithubMark />}
						prominence="low"
						rel="noreferrer noopener"
						size="medium"
						target="_blank"
					/>
					<SiteDrawer
						className={cx(
							tree ? styles.menuTriggerWithSidebar : styles.menuTrigger,
							styles.transitionItem.menu,
						)}
						tree={tree}
					/>
				</div>
			</div>
		</Box>
	);
}

function SiteDestinations({ hideActiveDestination }: { hideActiveDestination: boolean }) {
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const activeDestination = hideActiveDestination ? undefined : getActiveSiteDestination(pathname);

	return (
		<nav aria-label="Site" className={styles.destinations}>
			{siteDestinations.map((destination) => (
				<DestinationLink
					destination={destination}
					isActive={destination === activeDestination}
					key={destination.url}
				/>
			))}
		</nav>
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
			className={cx(
				styles.destination,
				styles.transitionItem[destination.label],
				isActive && styles.activeDestination,
			)}
			to={destination.url}
		>
			<span aria-hidden="true" className={styles.destinationWidth}>
				{destination.label}
			</span>
			<span className={styles.destinationLabel}>{destination.label}</span>
		</DocsLink>
	);
}

// TanStack's `useLinkProps` returns DOM event handlers that RAC's `Link` cannot accept, so the
// wordmark stays a raw `<a>`. It also overrides `aria-current`: TanStack marks the home route as
// current, while the other destinations use custom matching.
function SiteWordmark() {
	const linkProps = useLinkProps({ to: '/' });
	return (
		<a
			{...linkProps}
			aria-current={undefined}
			className={cx(styles.wordmark, styles.transitionItem.wordmark)}
			data-status={undefined}
		>
			Luke UI
		</a>
	);
}

function SidebarToggle() {
	const isCollapsed = useSyncExternalStore(
		subscribeToSidebarPref,
		getIsSidebarCollapsedSnapshot,
		getServerIsSidebarCollapsedSnapshot,
	);

	return (
		<IconButton
			aria-controls={DOCS_SIDEBAR_ID}
			aria-expanded={!isCollapsed}
			aria-label={isCollapsed ? 'Show sidebar' : 'Hide sidebar'}
			className={cx(styles.sidebarToggle, styles.transitionItem.sidebarToggle)}
			icon={<SidebarIcon className={styles.sidebarIcon} />}
			onPress={() => writeIsSidebarCollapsed(!isCollapsed)}
			prominence="low"
			size="medium"
		/>
	);
}

/** A labelled button that opens the theme controls in a popover. */
function AppearancePopover() {
	return (
		<DialogTrigger>
			<Button className={styles.transitionItem.theme} prominence="low" size="medium">
				Theme
			</Button>
			<Popover className={styles.appearancePopover} placement="bottom end">
				<Dialog aria-label="Appearance">
					{/* The Box registers the raised surface, so the toggles paint against it, not the page. */}
					<Box backgroundColor="surface.raised" borderRadius="surface" padding="space.8">
						<ThemeControls />
					</Box>
				</Dialog>
			</Popover>
		</DialogTrigger>
	);
}

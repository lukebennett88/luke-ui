import { Button } from '@luke-ui/react/button';
import { IconButton } from '@luke-ui/react/icon-button';
import { Stack } from '@luke-ui/react/stack';
import { vars } from '@luke-ui/react/theme';
import { useRouterState } from '@tanstack/react-router';
import type { Root } from 'fumadocs-core/page-tree';
import type { CSSProperties } from 'react';
import { useState, useSyncExternalStore } from 'react';
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Modal, ModalOverlay } from 'react-aria-components/Modal';
import { useIsDocsSidebarLayout } from '../lib/docs-container-queries.js';
import {
	getIsSidebarCollapsedSnapshot,
	getServerIsSidebarCollapsedSnapshot,
	subscribeToSidebarPref,
	writeIsSidebarCollapsed,
} from '../lib/sidebar-prefs.js';
import { getActiveSiteDestination, siteDestinations } from '../lib/site-destinations.js';
import { DocsNav, DocsNavLink } from './docs-nav.js';
import * as styles from './docs-shell.css.js';
import { DocsSearchTrigger } from './search.js';
import { SidebarIcon } from './sidebar-icon.js';
import {
	AppearancePopover,
	RepositoryLink,
	SiteDestinations,
	SiteHeader,
	SiteWordmark,
} from './site-nav.js';
import { ThemeControls } from './theme-controls.js';

/** The `id` of the docs sidebar, which the sidebar toggle controls. */
export const DOCS_SIDEBAR_ID = 'docs-sidebar';

const drawerSectionBorder = {
	borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
} as const satisfies CSSProperties;

/** Inset for the scrollable drawer body; the footer owns its own padding. */
const drawerBodyPadding = {
	paddingBlockEnd: 'space.16',
	paddingInline: 'space.16',
} as const;

/**
 * The docs header keeps search beside the sidebar toggle. Below the sidebar layout a drawer holds
 * the site and docs navigation and theme controls.
 */
export function DocsSiteNav({ tree }: { tree: Root }) {
	return (
		<SiteHeader className={styles.header}>
			<div className={styles.headerStart}>
				<div className={styles.headerBrand}>
					<SiteWordmark />
					<SidebarToggle />
					<div className={styles.headerSearch}>
						<DocsSearchTrigger isCompact />
					</div>
				</div>
			</div>
			<SiteDestinations className={styles.headerDestinations} />
			<div className={styles.headerActions}>
				<AppearancePopover className={styles.headerTheme} />
				<RepositoryLink />
				<NavigationDrawer tree={tree} />
			</div>
		</SiteHeader>
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
			className={styles.sidebarToggle}
			icon={<SidebarIcon className={styles.sidebarIcon} />}
			onPress={() => writeIsSidebarCollapsed(!isCollapsed)}
			prominence="low"
			size="small"
		/>
	);
}

function NavigationDrawer({ tree }: { tree: Root }) {
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const activeDestination = getActiveSiteDestination(pathname);
	const isDocsSidebarLayout = useIsDocsSidebarLayout();
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	// Crossing into the desktop layout must drop modal state, not only hide the dialog with CSS.
	if (isDocsSidebarLayout && isDrawerOpen) {
		setIsDrawerOpen(false);
	}

	return (
		<DialogTrigger isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
			{/* No bars/menu glyph in the Luke UI set; match the Theme labelled control. */}
			<Button className={styles.mobileTrigger} prominence="low" size="small">
				Menu
			</Button>
			<ModalOverlay className={styles.drawerOverlay} isDismissable>
				<Modal className={styles.drawerModal}>
					<Dialog aria-label="Docs navigation" className={styles.drawerDialog}>
						{({ close }) => (
							<>
								<div className={styles.drawerHeader}>
									<span className={styles.drawerTitle}>Navigation</span>
									<IconButton
										aria-label="Close docs navigation"
										icon="close"
										onPress={close}
										size="small"
									/>
								</div>
								<Stack className={styles.drawerBody} gap="space.16" {...drawerBodyPadding}>
									<Stack
										elementType="nav"
										aria-label="Site"
										gap="space.4"
										paddingBlockEnd="space.16"
										style={drawerSectionBorder}
									>
										{siteDestinations.map((destination) => (
											<DocsNavLink
												href={destination.url}
												isCurrent={destination === activeDestination}
												key={destination.url}
												onNavigate={close}
											>
												{destination.label}
											</DocsNavLink>
										))}
									</Stack>
									<DocsNav onNavigate={close} tree={tree} />
								</Stack>
								<div className={styles.drawerFooter}>
									<ThemeControls />
								</div>
							</>
						)}
					</Dialog>
				</Modal>
			</ModalOverlay>
		</DialogTrigger>
	);
}

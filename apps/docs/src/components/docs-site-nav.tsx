import { Button } from '@luke-ui/react/button';
import { IconButton } from '@luke-ui/react/icon-button';
import { useRouterState } from '@tanstack/react-router';
import type { Root } from 'fumadocs-core/page-tree';
import { useState } from 'react';
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Modal, ModalOverlay } from 'react-aria-components/Modal';
import { useIsDocsSidebarLayout } from '../lib/docs-sidebar-media.js';
import { getActiveSiteDestination, siteDestinations } from '../lib/site-destinations.js';
import { DocsLink } from './docs-link.js';
import { DocsNav } from './docs-nav.js';
import * as styles from './docs-shell.css.js';
import { SiteNav } from './site-nav.js';

export function DocsSiteNav({ tree }: { tree: Root }) {
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const activeDestination = getActiveSiteDestination(pathname);
	const isDocsSidebarLayout = useIsDocsSidebarLayout();
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	// Crossing into the desktop layout must drop modal state, not only hide the dialog with CSS.
	if (isDocsSidebarLayout && isDrawerOpen) {
		setIsDrawerOpen(false);
	}

	return (
		<SiteNav className={styles.header} hasSidebarNavigation>
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
										<span>Navigation</span>
										<IconButton
											aria-label="Close docs navigation"
											icon="close"
											onPress={close}
											size="small"
										/>
									</div>
									<nav aria-label="Site" className={styles.drawerSiteNav}>
										{siteDestinations.map((destination) => (
											<DocsLink
												activeOptions={{ exact: true }}
												aria-current={destination === activeDestination ? 'page' : undefined}
												key={destination.url}
												onClick={close}
												to={destination.url}
											>
												{destination.label}
											</DocsLink>
										))}
									</nav>
									<DocsNav onNavigate={close} tree={tree} />
								</>
							)}
						</Dialog>
					</Modal>
				</ModalOverlay>
			</DialogTrigger>
		</SiteNav>
	);
}

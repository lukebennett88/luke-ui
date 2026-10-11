import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { IconButton } from '@luke-ui/react/icon-button';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { useRouterState } from '@tanstack/react-router';
import type { Root } from 'fumadocs-core/page-tree';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Modal, ModalOverlay } from 'react-aria-components/Modal';
import { useIsDocsSidebarLayout } from '../lib/docs-container-queries.js';
import { getActiveSiteDestination, siteDestinations } from '../lib/site-destinations.js';
import { DocsNav, DocsNavLink, docsNavPaneProps } from './docs-nav.js';
import * as styles from './docs-shell.css.js';
import { SiteNav } from './site-nav.js';

const drawerSiteNavBorder = {
	borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
} as const satisfies CSSProperties;

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
								<Stack gap="sp16" {...docsNavPaneProps}>
									<Box alignItems="center" display="flex" justifyContent="space-between">
										<Text elementType="span" fontWeight="heading">
											Navigation
										</Text>
										<IconButton
											aria-label="Close docs navigation"
											icon="close"
											onPress={close}
											size="small"
										/>
									</Box>
									<Stack
										elementType="nav"
										aria-label="Site"
										gap="sp4"
										paddingBlockEnd="sp16"
										style={drawerSiteNavBorder}
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
							)}
						</Dialog>
					</Modal>
				</ModalOverlay>
			</DialogTrigger>
		</SiteNav>
	);
}

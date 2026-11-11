import { Button } from '@luke-ui/react/button';
import { IconButton } from '@luke-ui/react/icon-button';
import { useRouterState } from '@tanstack/react-router';
import type { Root } from 'fumadocs-core/page-tree';
import { useEffect, useId, useRef, useState } from 'react';
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Modal, ModalOverlay } from 'react-aria-components/Modal';
import { DocsLink } from '../components/docs-link.js';
import { GithubMark } from '../components/github-mark.js';
import { GITHUB_REPO_URL } from '../lib/github.js';
import { useIsDocsSidebarLayout, useIsSiteHeaderDesktop } from './docs-container-queries.js';
import { DocsNav, DocsNavLink } from './docs-nav.js';
import { getActiveSiteDestination, siteDestinations } from './site-destinations.js';
import * as styles from './site-drawer.css.js';

/**
 * The Menu button and the drawer it opens. The drawer holds what the header leaves out: the
 * destinations and GitHub under the compact header, and the tree on a page whose sidebar is hidden.
 *
 * CSS hides the button when the drawer has nothing to add. JS closes an open drawer at the same
 * point, because a hidden trigger does not release the modal's focus trap and scroll lock.
 */
export function SiteDrawer({ className, tree }: { className?: string; tree?: Root }) {
	const isHeaderDesktop = useIsSiteHeaderDesktop();
	const isSidebarLayout = useIsDocsSidebarLayout();
	const [isOpen, setIsOpen] = useState(false);
	const titleId = useId();
	const isNeeded = !isHeaderDesktop || (tree !== undefined && !isSidebarLayout);

	if (isOpen && !isNeeded) {
		setIsOpen(false);
	}

	return (
		<DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
			<Button className={className} prominence="low" size="medium">
				Menu
			</Button>
			<ModalOverlay className={styles.overlay} isDismissable>
				<Modal className={styles.modal}>
					<Dialog aria-labelledby={titleId} className={styles.dialog}>
						{({ close }) => (
							<>
								<div className={styles.header}>
									<span className={styles.title} id={titleId}>
										Menu
									</span>
									<IconButton
										aria-label="Close menu"
										icon="close"
										onPress={close}
										prominence="low"
										size="medium"
									/>
								</div>
								<div className={styles.body}>
									{tree ? (
										<TreeDrawerContent
											isHeaderDesktop={isHeaderDesktop}
											onNavigate={close}
											tree={tree}
										/>
									) : (
										<SiteLinks onNavigate={close} />
									)}
								</div>
							</>
						)}
					</Dialog>
				</Modal>
			</ModalOverlay>
		</DialogTrigger>
	);
}

function SiteLinks({ onNavigate }: { onNavigate: () => void }) {
	const activeDestination = useActiveSiteDestination();
	return (
		<nav aria-label="Site" className={styles.group}>
			{siteDestinations.map((destination) => (
				<DocsNavLink
					href={destination.url}
					isCurrent={destination === activeDestination}
					key={destination.url}
					onNavigate={onNavigate}
				>
					{destination.label}
				</DocsNavLink>
			))}
			<GithubFooter onNavigate={onNavigate} />
		</nav>
	);
}

/** The desktop header already links to the sections and GitHub, so only the tree is left. */
function TreeDrawerContent({
	isHeaderDesktop,
	onNavigate,
	tree,
}: {
	isHeaderDesktop: boolean;
	onNavigate: () => void;
	tree: Root;
}) {
	const treeRef = useRef<HTMLDivElement>(null);

	// This mounts when the drawer opens, so it runs once per open.
	useEffect(() => {
		treeRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' });
	}, []);

	return (
		<>
			{isHeaderDesktop ? null : <SectionSwitcher onNavigate={onNavigate} />}
			<div ref={treeRef}>
				<DocsNav onNavigate={onNavigate} tree={tree} />
			</div>
			{isHeaderDesktop ? null : <GithubFooter onNavigate={onNavigate} />}
		</>
	);
}

function SectionSwitcher({ onNavigate }: { onNavigate: () => void }) {
	const activeDestination = useActiveSiteDestination();
	return (
		<nav aria-label="Sections" className={styles.switcher}>
			{siteDestinations.map((destination) => (
				<DocsLink
					activeOptions={{ exact: true }}
					aria-current={destination === activeDestination ? 'page' : undefined}
					className={styles.segment}
					key={destination.url}
					onClick={onNavigate}
					to={destination.url}
				>
					{destination.label}
				</DocsLink>
			))}
		</nav>
	);
}

function GithubFooter({ onNavigate }: { onNavigate: () => void }) {
	return (
		<div className={styles.footer}>
			<DocsNavLink href={GITHUB_REPO_URL} icon={<GithubMark />} isExternal onNavigate={onNavigate}>
				GitHub
			</DocsNavLink>
		</div>
	);
}

function useActiveSiteDestination() {
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	return getActiveSiteDestination(pathname);
}

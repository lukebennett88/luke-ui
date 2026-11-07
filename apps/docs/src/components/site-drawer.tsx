import { Button } from '@luke-ui/react/button';
import { IconButton } from '@luke-ui/react/icon-button';
import { useRouterState } from '@tanstack/react-router';
import type { Root } from 'fumadocs-core/page-tree';
import { useEffect, useId, useRef, useState } from 'react';
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Modal, ModalOverlay } from 'react-aria-components/Modal';
import { useIsDocsSidebarLayout, useIsSiteHeaderDesktop } from '../lib/docs-container-queries.js';
import { GITHUB_REPO_URL } from '../lib/github.js';
import { getActiveSiteDestination, siteDestinations } from '../lib/site-destinations.js';
import { DocsLink } from './docs-link.js';
import { DocsNav, DocsNavLink } from './docs-nav.js';
import { GithubMark } from './github-mark.js';
import * as styles from './site-drawer.css.js';

/**
 * What the drawer holds. The header decides which one applies, so the content always matches what
 * the header leaves out.
 *
 * - `simple`: a page with no tree. The destinations and GitHub.
 * - `switcher`: a page with a tree, under the compact header. The section switcher, the tree and
 *   GitHub.
 * - `tree`: a page with a tree, under the desktop header but with no sidebar. Only the tree,
 *   because the header already links to the sections.
 */
type DrawerVariant = 'simple' | 'switcher' | 'tree';

/**
 * The Menu button and the drawer it opens. The header renders this one component and nothing else
 * about the drawer, so its content can change without touching the header.
 *
 * CSS shows the button only while the page needs a drawer. JS needs the same answer to close an
 * open modal drawer when the button hides, because a hidden trigger does not release the modal's
 * focus trap and scroll lock.
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
			{/* No bars/menu glyph in the Luke UI set, so the trigger is a labelled button like Theme. */}
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
								<DrawerBody
									onNavigate={close}
									tree={tree}
									variant={getVariant(tree, isHeaderDesktop)}
								/>
							</>
						)}
					</Dialog>
				</Modal>
			</ModalOverlay>
		</DialogTrigger>
	);
}

function getVariant(tree: Root | undefined, isHeaderDesktop: boolean): DrawerVariant {
	if (!tree) return 'simple';
	return isHeaderDesktop ? 'tree' : 'switcher';
}

function DrawerBody({
	onNavigate,
	tree,
	variant,
}: {
	onNavigate: () => void;
	tree: Root | undefined;
	variant: DrawerVariant;
}) {
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const activeDestination = getActiveSiteDestination(pathname);
	const treeRef = useRef<HTMLDivElement>(null);

	// The body mounts when the drawer opens, so this runs once per open.
	useEffect(() => {
		treeRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' });
	}, []);

	return (
		<div className={styles.body}>
			{variant === 'simple' ? (
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
					<div className={styles.footer}>
						<DocsNavLink href={GITHUB_REPO_URL} icon={<GithubMark />} isExternal>
							GitHub
						</DocsNavLink>
					</div>
				</nav>
			) : null}
			{variant === 'switcher' ? (
				<nav aria-label="Sections" className={styles.switcher}>
					{siteDestinations.map((destination) => {
						const isCurrent = destination === activeDestination;
						return (
							<DocsLink
								activeOptions={{ exact: true }}
								aria-current={isCurrent ? 'page' : undefined}
								className={styles.segment}
								key={destination.url}
								onClick={onNavigate}
								to={destination.url}
							>
								{destination.label}
							</DocsLink>
						);
					})}
				</nav>
			) : null}
			{tree ? (
				<div ref={treeRef}>
					<DocsNav onNavigate={onNavigate} tree={tree} />
				</div>
			) : null}
			{variant === 'switcher' ? (
				<div className={styles.footer}>
					<DocsNavLink href={GITHUB_REPO_URL} icon={<GithubMark />} isExternal>
						GitHub
					</DocsNavLink>
				</div>
			) : null}
		</div>
	);
}

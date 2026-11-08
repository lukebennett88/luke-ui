import type { BoxProps } from '@luke-ui/react/box';
import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { Link } from '@luke-ui/react/link';
import { Lockup, LockupBody, LockupRail } from '@luke-ui/react/lockup';
import { Stack } from '@luke-ui/react/stack';
import { cx } from '@luke-ui/react/utils';
import { useRouterState } from '@tanstack/react-router';
import { fallbackVar } from '@vanilla-extract/css';
import type { Folder, Node, Root, Separator } from 'fumadocs-core/page-tree';
import type { ReactNode } from 'react';
import { useId } from 'react';
import { getActiveSiteDestination } from '../lib/site-destinations.js';
import { plainList } from '../styles/plain-list.css.js';
import { DocsLink } from './docs-link.js';
import * as styles from './docs-shell.css.js';

type NavItem = Exclude<Node, Separator>;

type NavEntry =
	| { type: 'item'; node: NavItem }
	| { type: 'section'; name: ReactNode; items: Array<NavItem> };

/** Hit-target chrome shared by section headings and nav links. */
const navRowProps = {
	alignItems: 'center',
	borderRadius: 'control',
	display: 'flex',
	minBlockSize: '2rem',
	paddingInline: 'space.8',
} as const;

const navLinkRestMinBlockSize = '2.25rem';

/** Top inset shared by the article and desktop TOC so the two columns line up. */
export const docsContentPaddingBlockStart =
	'space.48' as const satisfies BoxProps['paddingBlockStart'];

/** Outer inset for the mobile drawer and desktop TOC panes. */
export const docsNavPaneProps = {
	paddingBlockEnd: 'space.32',
	paddingBlockStart: docsContentPaddingBlockStart,
	paddingInline: 'space.16',
} as const;

interface DocsNavProps {
	onNavigate?: () => void;
	tree: Root;
}

export function DocsNav({ onNavigate, tree }: DocsNavProps) {
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const labelIdPrefix = useId();
	// The section names the landmark, so the Components tree is not announced as "Docs".
	const label = getActiveSiteDestination(pathname)?.label ?? 'Docs';
	const roots = collectRootFolders(tree);
	const activeRoot = findActiveRoot(roots, pathname);
	const nodes = (() => {
		if (!activeRoot) return tree.children;
		if (activeRoot.index) return [activeRoot.index, ...activeRoot.children];
		return activeRoot.children;
	})();

	return (
		<Box aria-label={label} elementType="nav" paddingBlockStart="space.16">
			<NavList labelIdPrefix={labelIdPrefix} nodes={nodes} onNavigate={onNavigate} />
		</Box>
	);
}

function NavList({
	labelIdPrefix,
	labelledBy,
	nodes,
	onNavigate,
}: {
	labelIdPrefix: string;
	labelledBy?: string;
	nodes: Array<Node>;
	onNavigate?: () => void;
}) {
	const entries = groupNavEntries(nodes);

	return (
		<Stack
			aria-labelledby={labelledBy}
			className={plainList}
			elementType="ul"
			gap="space.4"
			margin="0"
			padding="0"
		>
			{entries.map((entry, index) => {
				if (entry.type === 'section') {
					return (
						<NavSection
							items={entry.items}
							key={`section-${index}`}
							labelId={`${labelIdPrefix}-section-${index}`}
							labelIdPrefix={labelIdPrefix}
							name={entry.name}
							onNavigate={onNavigate}
						/>
					);
				}
				return (
					<NavItemNode
						key={entry.node.$id ?? `item-${index}`}
						labelId={`${labelIdPrefix}-item-${index}`}
						labelIdPrefix={labelIdPrefix}
						node={entry.node}
						onNavigate={onNavigate}
					/>
				);
			})}
		</Stack>
	);
}

function NavSection({
	items,
	labelId,
	labelIdPrefix,
	name,
	onNavigate,
}: {
	items: Array<NavItem>;
	labelId: string;
	labelIdPrefix: string;
	name: ReactNode;
	onNavigate?: () => void;
}) {
	return (
		<SectionFrame>
			<SectionHeading id={labelId}>{name}</SectionHeading>
			<NavList
				labelIdPrefix={labelIdPrefix}
				labelledBy={labelId}
				nodes={items}
				onNavigate={onNavigate}
			/>
		</SectionFrame>
	);
}

function NavItemNode({
	labelId,
	labelIdPrefix,
	node,
	onNavigate,
}: {
	labelId: string;
	labelIdPrefix: string;
	node: NavItem;
	onNavigate?: () => void;
}) {
	if (node.type === 'folder') {
		return (
			<NavFolder
				folder={node}
				labelId={labelId}
				labelIdPrefix={labelIdPrefix}
				onNavigate={onNavigate}
			/>
		);
	}

	return (
		<Box elementType="li">
			<DocsNavLink
				href={node.url}
				icon={node.icon}
				isExternal={node.external}
				onNavigate={onNavigate}
			>
				{node.name}
			</DocsNavLink>
		</Box>
	);
}

function NavFolder({
	folder,
	labelId,
	labelIdPrefix,
	onNavigate,
}: {
	folder: Folder;
	labelId: string;
	labelIdPrefix: string;
	onNavigate?: () => void;
}) {
	const childNodes = folder.index ? [folder.index, ...folder.children] : folder.children;

	return (
		<SectionFrame>
			<SectionHeading icon={folder.icon} id={labelId}>
				{folder.name}
			</SectionHeading>
			<NavList
				labelIdPrefix={labelIdPrefix}
				labelledBy={labelId}
				nodes={childNodes}
				onNavigate={onNavigate}
			/>
		</SectionFrame>
	);
}

function SectionFrame({ children }: { children: ReactNode }) {
	return (
		<Stack elementType="li" gap="space.4" paddingBlockEnd="space.8" paddingBlockStart="space.24">
			{children}
		</Stack>
	);
}

function SectionHeading({
	children,
	icon,
	id,
}: {
	children: ReactNode;
	icon?: ReactNode;
	id: string;
}) {
	return (
		<Box {...navRowProps}>
			<Heading
				color="secondary"
				fontWeight="label"
				id={id}
				level={2}
				shouldDisableTrim
				typography="caption"
			>
				{icon == null ? (
					children
				) : (
					<Lockup elementType="span" gap="space.8">
						<LockupRail>{icon}</LockupRail>
						<LockupBody>{children}</LockupBody>
					</Lockup>
				)}
			</Heading>
		</Box>
	);
}

/** Docs sidebar / drawer link with layout on Box and interaction styles in VE. */
export function DocsNavLink({
	children,
	href,
	icon,
	isCurrent,
	isExternal = false,
	onNavigate,
}: {
	children: ReactNode;
	href: string;
	icon?: ReactNode;
	/** Overrides route matching when the active section is not the link URL exactly. */
	isCurrent?: boolean;
	isExternal?: boolean;
	onNavigate?: () => void;
}) {
	return (
		<Box
			{...navRowProps}
			inlineSize="100%"
			minBlockSize={fallbackVar(styles.navLinkMinBlockSize, navLinkRestMinBlockSize)}
			renderRoot={(domProps) => {
				const className = cx(domProps.className, styles.navLink);
				if (isExternal) {
					return (
						<Link
							{...domProps}
							className={className}
							href={href}
							onPress={onNavigate}
							rel="noopener noreferrer"
							target="_blank"
						/>
					);
				}
				return (
					<DocsLink
						{...domProps}
						activeOptions={{ exact: true }}
						{...(isCurrent === undefined
							? {}
							: { 'aria-current': isCurrent ? ('page' as const) : undefined })}
						className={className}
						onClick={onNavigate}
						to={href}
					/>
				);
			}}
		>
			{icon == null ? (
				children
			) : (
				<Lockup gap="space.8">
					<LockupRail>{icon}</LockupRail>
					<LockupBody>{children}</LockupBody>
				</Lockup>
			)}
		</Box>
	);
}

/**
 * Groups separator markers into sections that own the following pages and folders. A section
 * holding a single page drops its heading, which would add a row and no information.
 */
function groupNavEntries(nodes: Array<Node>): Array<NavEntry> {
	const entries: Array<NavEntry> = [];
	let openSection: Extract<NavEntry, { type: 'section' }> | undefined;

	for (const node of nodes) {
		if (node.type === 'separator') {
			openSection = { type: 'section', name: node.name, items: [] };
			entries.push(openSection);
			continue;
		}
		if (openSection) {
			openSection.items.push(node);
			continue;
		}
		entries.push({ type: 'item', node });
	}

	return entries.flatMap((entry): Array<NavEntry> => {
		if (entry.type === 'item') return [entry];
		const [onlyItem] = entry.items;
		if (entry.items.length === 1 && onlyItem?.type === 'page') {
			return [{ type: 'item', node: onlyItem }];
		}
		return entry.items.length > 0 ? [entry] : [];
	});
}

function collectRootFolders(tree: Root): Array<Folder> {
	const roots: Array<Folder> = [];
	for (let current: Root | undefined = tree; current; current = current.fallback) {
		for (const node of current.children) {
			if (node.type === 'folder' && node.root) roots.push(node);
		}
	}
	return roots;
}

/** First path segment for a page URL, used as the site section key (`/docs`, `/components`). */
function sectionKey(url: string) {
	return `/${url.split('/')[1]}`;
}

function findActiveRoot(roots: Array<Folder>, pathname: string): Folder | undefined {
	const pathnameSection = sectionKey(pathname);
	for (const root of roots) {
		const url = root.index?.url ?? root.children.find((node) => node.type === 'page')?.url;
		if (!url) continue;
		if (sectionKey(url) === pathnameSection) return root;
	}
	return roots[0];
}

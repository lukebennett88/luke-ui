import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { Link } from '@luke-ui/react/link';
import { Stack } from '@luke-ui/react/stack';
import { vars } from '@luke-ui/react/theme';
import { Track } from '@luke-ui/react/track';
import { cx } from '@luke-ui/react/utils';
import { useRouterState } from '@tanstack/react-router';
import type { Folder, Node, Root, Separator } from 'fumadocs-core/page-tree';
import type { CSSProperties, ReactNode } from 'react';
import { useId } from 'react';
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
	paddingInline: 'sp8',
} as const;

/** Top inset shared by the sidebar, article, and desktop TOC so the three columns line up. */
export const docsContentPaddingBlockStart = 'sp48' as const satisfies keyof typeof vars.space;

/** Outer inset for the desktop sidebar and mobile drawer panes. */
export const docsNavPaneProps = {
	paddingBlockEnd: 'sp32',
	paddingBlockStart: docsContentPaddingBlockStart,
	paddingInline: 'sp16',
} as const;

interface DocsNavProps {
	onNavigate?: () => void;
	tree: Root;
}

export function DocsNav({ onNavigate, tree }: DocsNavProps) {
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const labelIdPrefix = useId();
	const roots = collectRootFolders(tree);
	const activeRoot = findActiveRoot(roots, pathname);
	const nodes = (() => {
		if (!activeRoot) return tree.children;
		if (activeRoot.index) return [activeRoot.index, ...activeRoot.children];
		return activeRoot.children;
	})();

	return (
		<Box aria-label="Docs" elementType="nav">
			<NavList isTopLevel labelIdPrefix={labelIdPrefix} nodes={nodes} onNavigate={onNavigate} />
		</Box>
	);
}

function NavList({
	isTopLevel = false,
	labelIdPrefix,
	labelledBy,
	nodes,
	onNavigate,
}: {
	isTopLevel?: boolean;
	labelIdPrefix: string;
	labelledBy?: string;
	nodes: Array<Node>;
	onNavigate?: () => void;
}) {
	const entries = groupNavEntries(nodes);

	return (
		<Stack aria-labelledby={labelledBy} elementType="ul" gap="sp4">
			{entries.map((entry, index) => {
				const isFirst = isTopLevel && index === 0;
				if (entry.type === 'section') {
					return (
						<NavSection
							isFirst={isFirst}
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
						isFirst={isFirst}
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
	isFirst,
	items,
	labelId,
	labelIdPrefix,
	name,
	onNavigate,
}: {
	isFirst: boolean;
	items: Array<NavItem>;
	labelId: string;
	labelIdPrefix: string;
	name: ReactNode;
	onNavigate?: () => void;
}) {
	return (
		<SectionFrame isFirst={isFirst}>
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
	isFirst = false,
	labelId,
	labelIdPrefix,
	node,
	onNavigate,
}: {
	isFirst?: boolean;
	labelId: string;
	labelIdPrefix: string;
	node: NavItem;
	onNavigate?: () => void;
}) {
	if (node.type === 'folder') {
		return (
			<NavFolder
				folder={node}
				isFirst={isFirst}
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
	isFirst,
	labelId,
	labelIdPrefix,
	onNavigate,
}: {
	folder: Folder;
	isFirst: boolean;
	labelId: string;
	labelIdPrefix: string;
	onNavigate?: () => void;
}) {
	const childNodes = folder.index ? [folder.index, ...folder.children] : folder.children;

	return (
		<SectionFrame isFirst={isFirst}>
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

const sectionBorder = {
	borderBlockStart: `1px solid ${vars.color.border.decorative}`,
} as const satisfies CSSProperties;

function SectionFrame({ children, isFirst }: { children: ReactNode; isFirst: boolean }) {
	return (
		<Stack
			elementType="li"
			gap="sp4"
			paddingBlock="sp16"
			style={isFirst ? undefined : sectionBorder}
		>
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
	const heading = (
		<Heading
			color="secondary"
			fontWeight="label"
			id={id}
			level={2}
			shouldDisableTrim
			typography="caption"
		>
			{children}
		</Heading>
	);

	return (
		<Box {...navRowProps}>
			{icon == null ? (
				heading
			) : (
				<Track gap="sp8" railAlignment="firstLine" railStart={icon}>
					{heading}
				</Track>
			)}
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
			renderRoot={(domProps) => {
				const className = cx(domProps.className, styles.navLink);
				if (isExternal) {
					return (
						<Link
							{...domProps}
							className={className}
							href={href}
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
				<Track gap="sp8" railAlignment="firstLine" railStart={icon}>
					{children}
				</Track>
			)}
		</Box>
	);
}

/** Groups separator markers into sections that own the following pages and folders. */
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

	return entries.filter((entry) => entry.type === 'item' || entry.items.length > 0);
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

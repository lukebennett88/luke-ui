import { Box } from '@luke-ui/react/box';
import { Grid } from '@luke-ui/react/grid';
import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { Track } from '@luke-ui/react/track';
import { useRouterState } from '@tanstack/react-router';
import type { Folder, Item, Node, Root } from 'fumadocs-core/page-tree';
import { findPath, flattenTree } from 'fumadocs-core/page-tree';
import type { CSSProperties, ReactNode } from 'react';
import { DocsCardLink } from '../docs-card.js';
import * as styles from './docs-article.css.js';

/**
 * Links to the pages before and after the current one. The order is the sidebar order within the
 * section that contains the page, so a section's index page comes first.
 */
export function DocsPager({ tree }: { tree: Root }) {
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const { next, previous } = findNeighbours(tree, pathname);

	if (!previous && !next) return null;

	return (
		<Box elementType="footer" marginBlockStart="sp64" paddingBlockStart="sp32" style={footerRule}>
			<Grid
				aria-label="Pagination"
				columns="repeat(auto-fit, minmax(min(100%, 16rem), 1fr))"
				elementType="nav"
				gap="sp16"
			>
				{previous ? <PagerLink direction="previous" page={previous} /> : null}
				{next ? <PagerLink direction="next" page={next} /> : null}
			</Grid>
		</Box>
	);
}

const footerRule = {
	borderBlockStart: `1px solid ${vars.color.border.decorative}`,
} as const satisfies CSSProperties;

const TRAILING_SLASH_PATTERN = /\/+$/;

function normalisePathname(pathname: string) {
	return pathname.replace(TRAILING_SLASH_PATTERN, '') || '/';
}

function findNeighbours(tree: Root, pathname: string): { next?: Item; previous?: Item } {
	const url = normalisePathname(pathname);
	const isCurrentPage = (node: Node) => node.type === 'page' && normalisePathname(node.url) === url;

	for (let current: Root | undefined = tree; current; current = current.fallback) {
		const path = findPath(current.children, isCurrentPage);
		if (!path) continue;

		const section = path
			.filter((node): node is Folder => node.type === 'folder' && node.root === true)
			.at(-1);
		const pages = flattenTree(section ? [section] : current.children).filter(
			(page) => !page.external,
		);
		const index = pages.findIndex((page) => normalisePathname(page.url) === url);
		return { next: pages[index + 1], previous: pages[index - 1] };
	}
	return {};
}

type PagerDirection = 'next' | 'previous';

const pagerDirection = {
	previous: {
		align: 'start',
		chevron: 'chevronLeft',
		fallbackDescription: 'Previous Page',
	},
	next: {
		align: 'end',
		chevron: 'chevronRight',
		fallbackDescription: 'Next Page',
	},
} as const satisfies Record<
	PagerDirection,
	{
		align: 'end' | 'start';
		chevron: 'chevronLeft' | 'chevronRight';
		fallbackDescription: string;
	}
>;

function PagerLink({ direction, page }: { direction: PagerDirection; page: Item }) {
	const { align, fallbackDescription } = pagerDirection[direction];
	const description: string = (() => {
		if (typeof page.description === 'string' && page.description.length > 0) {
			return page.description;
		}
		return fallbackDescription;
	})();

	return (
		<DocsCardLink align={align} href={page.url}>
			<Stack gap="sp12" minInlineSize="0">
				<PagerTitle direction={direction} name={page.name} />
				<Text
					color="secondary"
					elementType="div"
					fontWeight="body"
					lineClamp={1}
					textAlign={align}
					typography="label"
				>
					{description}
				</Text>
			</Stack>
		</DocsCardLink>
	);
}

function PagerTitle({ direction, name }: { direction: PagerDirection; name: ReactNode }) {
	const chevron = (
		<Icon className={styles.pagerIcon} name={pagerDirection[direction].chevron} size="xsmall" />
	);

	return (
		<Text
			elementType="div"
			fontWeight="label"
			style={
				direction === 'next'
					? { marginInlineStart: 'auto', maxInlineSize: '100%', width: 'fit-content' }
					: undefined
			}
			typography="label"
		>
			<Track
				gap="sp8"
				railAlignment="firstLine"
				railEnd={direction === 'next' ? chevron : undefined}
				railStart={direction === 'previous' ? chevron : undefined}
			>
				<Text elementType="span" shouldInheritFont>
					{name}
				</Text>
			</Track>
		</Text>
	);
}

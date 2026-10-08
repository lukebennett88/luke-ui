import { Icon } from '@luke-ui/react/icon';
import { Text } from '@luke-ui/react/text';
import { cx } from '@luke-ui/react/utils';
import { Link, useRouterState } from '@tanstack/react-router';
import type { Folder, Item, Node, Root } from 'fumadocs-core/page-tree';
import { findPath, flattenTree } from 'fumadocs-core/page-tree';
import { blockLink } from './block-link.css.js';
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
		<footer className={styles.footer}>
			<nav aria-label="Pagination" className={styles.pager}>
				{previous ? <PagerLink direction="previous" page={previous} /> : null}
				{next ? <PagerLink direction="next" page={next} /> : null}
			</nav>
		</footer>
	);
}

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

function PagerLink({ direction, page }: { direction: 'next' | 'previous'; page: Item }) {
	const isNext = direction === 'next';

	return (
		<Link className={cx(blockLink, isNext && styles.pagerNext)} to={page.url}>
			<span className={cx(styles.pagerRow, isNext && styles.pagerRowNext)}>
				<Icon className={styles.pagerIcon} name={isNext ? 'chevronRight' : 'chevronLeft'} />
				<span className={styles.pagerText}>
					<Text color="secondary" typography="caption">
						{isNext ? 'Next' : 'Previous'}
					</Text>
					<Text fontWeight="label">{page.name}</Text>
				</span>
			</span>
		</Link>
	);
}

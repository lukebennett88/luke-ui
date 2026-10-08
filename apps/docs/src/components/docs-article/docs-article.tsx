import { Heading } from '@luke-ui/react/heading';
import { Prose } from '@luke-ui/react/prose';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import type { Root } from 'fumadocs-core/page-tree';
import type { TOCItemType } from 'fumadocs-core/toc';
import { AnchorProvider } from 'fumadocs-core/toc';
import type { ReactNode } from 'react';
import * as styles from './docs-article.css.js';
import { DocsPager } from './docs-pager.js';
import { DocsTocBar, DocsTocColumn } from './docs-toc.js';

interface DocsArticleProps {
	/** Rendered MDX body. */
	children: ReactNode;
	/** Rendered below the description, such as the page actions. */
	actions: ReactNode;
	description: ReactNode;
	title: ReactNode;
	toc: Array<TOCItemType>;
	/** Page tree that orders the previous and next links. */
	tree: Root;
}

/**
 * One documentation page: title block, MDX body, previous and next links, and the table of
 * contents. It renders into the `toc-bar`, `main`, and `toc` areas of `DocsShell`.
 */
export function DocsArticle({
	actions,
	children,
	description,
	title,
	toc,
	tree,
}: DocsArticleProps) {
	const hasToc = toc.length > 0;

	return (
		<AnchorProvider toc={toc}>
			{hasToc ? <DocsTocBar toc={toc} /> : null}
			<main className={styles.main}>
				<article className={styles.article}>
					<Stack className={styles.header} elementType="header" gap="sp24">
						<Stack gap="sp12">
							<Heading level={1}>{title}</Heading>
							{description ? (
								<Text color="secondary" elementType="p" typography="lead">
									{description}
								</Text>
							) : null}
						</Stack>
						{actions}
					</Stack>
					<Prose>{children}</Prose>
					<DocsPager tree={tree} />
				</article>
			</main>
			{hasToc ? <DocsTocColumn toc={toc} /> : null}
		</AnchorProvider>
	);
}

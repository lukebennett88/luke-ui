import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { Prose } from '@luke-ui/react/prose';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import type { Root } from 'fumadocs-core/page-tree';
import type { TOCItemType } from 'fumadocs-core/toc';
import { AnchorProvider } from 'fumadocs-core/toc';
import type { ReactNode } from 'react';
import { docsContentPaddingBlockStart } from '../docs-nav.js';
import * as styles from './docs-article.css.js';
import { DocsPager } from './docs-pager.js';
import { DocsTocBar, DocsTocColumn } from './docs-toc.js';

/** Roughly 75 characters of body text; still leaves room for example frames. */
const ARTICLE_MAX_INLINE_SIZE = '52rem';

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
 * contents. It renders into the `main` and `toc` areas of `DocsShell`.
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
			<Box elementType="main" gridArea="main" minInlineSize="0">
				{hasToc ? <DocsTocBar toc={toc} /> : null}
				<Box
					paddingBlockEnd={{
						initial: 'sp64',
						bp768: 'sp96',
					}}
					paddingBlockStart={docsContentPaddingBlockStart}
					paddingInline={{
						initial: 'sp16',
						bp768: 'sp24',
						bp1024: 'sp32',
					}}
				>
					<Box
						className={styles.article}
						elementType="article"
						maxInlineSize={ARTICLE_MAX_INLINE_SIZE}
					>
						<Stack elementType="header" gap="sp24" marginBlockEnd="sp48">
							<Stack gap="sp24">
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
					</Box>
				</Box>
			</Box>
			{hasToc ? <DocsTocColumn toc={toc} /> : null}
		</AnchorProvider>
	);
}

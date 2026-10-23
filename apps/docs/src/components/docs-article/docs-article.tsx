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
	/** The sidebar section the page belongs to, shown above the title. */
	sectionName: string | null;
	title: ReactNode;
	toc: Array<TOCItemType>;
	/** Page tree that orders the previous and next links. */
	tree: Root;
}

/**
 * One documentation page: title block, MDX body, previous and next links, and the table of
 * contents. It renders into the `main` and `toc` areas of `DocsShell`'s content panel.
 */
export function DocsArticle({
	actions,
	children,
	description,
	sectionName,
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
						initial: 'space.64',
						bp768: 'space.96',
					}}
					paddingBlockStart={docsContentPaddingBlockStart}
					paddingInline={{
						initial: 'space.16',
						bp768: 'space.24',
						bp1024: 'space.32',
					}}
				>
					<Box
						className={styles.article}
						elementType="article"
						maxInlineSize={ARTICLE_MAX_INLINE_SIZE}
					>
						<Stack elementType="header" gap="space.24" marginBlockEnd="space.48">
							<Stack gap="space.24">
								<Stack gap="space.16">
									{sectionName == null ? null : (
										<Text
											className={styles.eyebrow}
											color="accent"
											elementType="p"
											fontWeight="emphasis"
											typography="label"
										>
											{sectionName}
										</Text>
									)}
									<Heading level={1}>{title}</Heading>
								</Stack>
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

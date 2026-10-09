import { Box } from '@luke-ui/react/box';
import { Heading } from '@luke-ui/react/heading';
import { Link } from '@luke-ui/react/link';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { cx } from '@luke-ui/react/utils';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import type { ReactNode } from 'react';
import * as styles from './docs-card.css.js';
import { DocsLink } from './docs-link.js';

const EXTERNAL_HREF_PATTERN = /^(?:\w+:|\/\/)/;

interface DocsCardLinkProps {
	align?: 'end' | 'start';
	children: ReactNode;
	href: string;
}

/** Bordered whole-surface link shared by the components index, MDX cards, and the pager. */
export function DocsCardLink({ align = 'start', children, href }: DocsCardLinkProps) {
	const isExternal = EXTERNAL_HREF_PATTERN.test(href);

	return (
		<Box
			blockSize="100%"
			borderColor="decorative"
			borderRadius="surface"
			borderStyle="solid"
			borderWidth="thin"
			className={cx(styles.cardLink, align === 'end' && styles.cardLinkAlignEnd)}
			minInlineSize="0"
			padding="sp16"
			renderRoot={(domProps) => {
				if (isExternal) {
					return (
						<Link
							{...domProps}
							appearance="text"
							href={href}
							rel="noreferrer noopener"
							target="_blank"
						/>
					);
				}

				const { hash, path } = splitHash(href);
				return <DocsLink {...domProps} appearance="text" hash={hash} to={path} />;
			}}
		>
			{children}
			{isExternal ? <VisuallyHidden> (opens in a new tab)</VisuallyHidden> : null}
		</Box>
	);
}

interface DocsCardProps {
	description: ReactNode;
	href: string;
	title: ReactNode;
}

/**
 * Title + description card used by the components index and MDX Continue learning links.
 * The title is a heading so topic cards join the document outline; callers nest
 * `HeadingLevels` so the level sits under the section heading (usually h3 under an h2).
 */
export function DocsCard({ description, href, title }: DocsCardProps) {
	return (
		<DocsCardLink href={href}>
			<Stack gap="sp12">
				<Heading fontWeight="label" typography="label">
					{title}
				</Heading>
				<Text color="secondary" elementType="div" fontWeight="body" typography="label">
					{description}
				</Text>
			</Stack>
		</DocsCardLink>
	);
}

function splitHash(href: string) {
	const hashIndex = href.indexOf('#');
	if (hashIndex === -1) return { hash: undefined, path: href };
	return { hash: href.slice(hashIndex + 1) || undefined, path: href.slice(0, hashIndex) };
}

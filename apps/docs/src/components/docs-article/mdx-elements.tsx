import { Code } from '@luke-ui/react/code';
import type { HeadingLevel } from '@luke-ui/react/heading';
import { Heading } from '@luke-ui/react/heading';
import { Icon } from '@luke-ui/react/icon';
import { IconButton } from '@luke-ui/react/icon-button';
import { Link as LukeLink } from '@luke-ui/react/link';
import { ScrollFade } from '@luke-ui/react/scroll-fade';
import { Text } from '@luke-ui/react/text';
import { cx } from '@luke-ui/react/utils';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import { Link as RouterLink } from '@tanstack/react-router';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { createContext, use } from 'react';
import { useCopyButton } from '../../lib/use-copy-button.js';
import * as codeBlockStyles from '../code-block/code-block.css.js';
import type { CodeBlockProps } from '../code-block/code-block.js';
import { CodeBlock } from '../code-block/code-block.js';
import { DocsLink } from '../docs-link.js';
import { LinkIcon } from '../link-icon.js';
import { blockLink } from './block-link.css.js';
import * as styles from './mdx-elements.css.js';

const EXTERNAL_HREF_PATTERN = /^(?:\w+:|\/\/)/;

type AnchorProps = Pick<ComponentPropsWithoutRef<'a'>, 'children' | 'href'>;

/** Link in MDX prose. External URLs open in a new tab. Internal paths navigate client-side. */
export function MdxLink({ children, href }: AnchorProps) {
	if (href === undefined) return <>{children}</>;

	if (EXTERNAL_HREF_PATTERN.test(href)) {
		return (
			<LukeLink href={href} rel="noreferrer noopener" target="_blank">
				{children}
			</LukeLink>
		);
	}

	// A same-page anchor needs no router. The browser scrolls to it.
	if (href.startsWith('#')) {
		return <LukeLink href={href}>{children}</LukeLink>;
	}

	const { hash, path } = splitHash(href);
	return (
		<DocsLink hash={hash} to={path}>
			{children}
		</DocsLink>
	);
}

/** Builds the heading renderer for one level, with a link and a copy button when it has an `id`. */
export function createMdxHeading(level: HeadingLevel) {
	return function MdxHeading({
		children,
		id,
	}: Pick<ComponentPropsWithoutRef<'h2'>, 'children' | 'id'>) {
		return (
			<Heading className={styles.heading} id={id} level={level}>
				{id === undefined ? (
					children
				) : (
					<>
						<a className={styles.headingAnchor} href={`#${id}`}>
							{children}
						</a>
						<CopyAnchorButton id={id} level={level} />
					</>
				)}
			</Heading>
		);
	};
}

function CopyAnchorButton({ id, level }: { id: string; level: HeadingLevel }) {
	const [copied, onCopy] = useCopyButton(() => {
		const url = new URL(window.location.href);
		url.hash = id;
		return navigator.clipboard.writeText(url.toString());
	});

	return (
		<span className={cx(styles.headingCopyWrapper, styles.headingCopyWrapperByLevel[level])}>
			<IconButton
				aria-label={copied ? 'Copied Anchor Link' : 'Copy Anchor Link'}
				className={styles.headingCopyButton}
				icon={copied ? 'check' : <LinkIcon />}
				onPress={onCopy}
				prominence="low"
				size="small"
			/>
			<VisuallyHidden aria-live="polite" role="status">
				{copied ? 'Copied' : ''}
			</VisuallyHidden>
		</span>
	);
}

// MDX wraps text on its own line inside a JSX element in a paragraph. A component that sets its own
// typography flags the paragraphs it receives so they inherit it.
const InheritTypographyContext = createContext(false);

export function MdxParagraph({ children }: Pick<ComponentPropsWithoutRef<'p'>, 'children'>) {
	const shouldInheritFont = use(InheritTypographyContext);
	return (
		<Text elementType="p" shouldInheritFont={shouldInheritFont}>
			{children}
		</Text>
	);
}

// MDX resolves a fence's `<code>` child through the same `code` mapping as inline code. The fence
// provides this flag so `MdxCode` leaves its markup to the docs `CodeBlock`.
const FenceContext = createContext(false);

/** Fenced code block. The docs `CodeBlock` owns highlighting and copying. */
export function MdxFence(props: CodeBlockProps) {
	return (
		<FenceContext value>
			<CodeBlock {...props} className={cx(codeBlockStyles.mdxFence, props.className)} />
		</FenceContext>
	);
}

/** Inline code. Code inside a fence renders as plain `<code>`. */
export function MdxCode(props: ComponentPropsWithoutRef<'code'>) {
	const isInFence = use(FenceContext);
	if (isInFence) return <code {...props} />;
	return <Code {...props} textWrap="pretty" />;
}

export function MdxImage({ alt, className, ...props }: ComponentPropsWithoutRef<'img'>) {
	return <img {...props} alt={alt} className={cx(styles.image, className)} />;
}

/** Table that scrolls on the inline axis inside its own bordered region. */
export function MdxTable({ className, ...props }: ComponentPropsWithoutRef<'table'>) {
	return (
		<ScrollFade aria-label="Scrollable table" className={styles.tableScroll}>
			<table {...props} className={cx(styles.table, className)} />
		</ScrollFade>
	);
}

export function Cards({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
	return <div {...props} className={cx(styles.cards, className)} />;
}

interface CardProps {
	/** Description text. `description` wins when both are set. */
	children?: ReactNode;
	description?: ReactNode;
	href: string;
	title: ReactNode;
}

/** Link block with a heading and a short description. */
export function Card({ children, description, href, title }: CardProps) {
	const content = (
		<div className={styles.cardRow}>
			<div>
				<Heading className={styles.cardTitle} level={3} typography="body">
					{title}
				</Heading>
				<Text
					className={styles.cardDescription}
					color="secondary"
					elementType="div"
					typography="label"
				>
					<InheritTypographyContext value>{description ?? children}</InheritTypographyContext>
				</Text>
			</div>
			<Icon className={styles.cardIcon} name="chevronRight" size="small" />
		</div>
	);

	if (EXTERNAL_HREF_PATTERN.test(href)) {
		return (
			<a className={blockLink} href={href} rel="noreferrer noopener" target="_blank">
				{content}
			</a>
		);
	}

	const { hash, path } = splitHash(href);
	return (
		<RouterLink className={blockLink} hash={hash} to={path}>
			{content}
		</RouterLink>
	);
}

/** Splits `/path#hash` into the path and the hash TanStack Router takes as a separate prop. */
function splitHash(href: string) {
	const hashIndex = href.indexOf('#');
	if (hashIndex === -1) return { hash: undefined, path: href };
	return { hash: href.slice(hashIndex + 1) || undefined, path: href.slice(0, hashIndex) };
}

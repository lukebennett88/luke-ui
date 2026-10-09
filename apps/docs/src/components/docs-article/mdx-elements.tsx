import { Code } from '@luke-ui/react/code';
import { Grid } from '@luke-ui/react/grid';
import type { HeadingLevel } from '@luke-ui/react/heading';
import { Heading, HeadingLevels } from '@luke-ui/react/heading';
import { IconButton } from '@luke-ui/react/icon-button';
import type { LinkProps } from '@luke-ui/react/link';
import { Link as LukeLink } from '@luke-ui/react/link';
import { ScrollFade } from '@luke-ui/react/scroll-fade';
import { Text } from '@luke-ui/react/text';
import { cx } from '@luke-ui/react/utils';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { createContext, use } from 'react';
import { useCopyButton } from '../../lib/use-copy-button.js';
import * as codeBlockStyles from '../code-block/code-block.css.js';
import type { CodeBlockProps } from '../code-block/code-block.js';
import { CodeBlock } from '../code-block/code-block.js';
import { DocsCard } from '../docs-card.js';
import { DocsLink } from '../docs-link.js';
import { LinkIcon } from '../link-icon.js';
import * as styles from './mdx-elements.css.js';

const EXTERNAL_HREF_PATTERN = /^(?:\w+:|\/\/)/;

// MDX passes attributes, not handlers. React Aria Components' `Link` types its own event handlers.
type AnchorProps = Omit<
	ComponentPropsWithoutRef<'a'>,
	'dangerouslySetInnerHTML' | 'style' | `on${string}`
>;

const EXTERNAL_REL_TOKENS = ['noreferrer', 'noopener'];

/**
 * Link in MDX prose. External URLs open in a new tab. Internal paths navigate client-side. Every
 * anchor attribute the author writes reaches the DOM.
 */
export function MdxLink({ children, href, ...props }: AnchorProps) {
	// Without an `href` the anchor is a placeholder: not interactive, but still a valid target for
	// `id` and a carrier for the author's other attributes.
	if (href === undefined) return <a {...props}>{children}</a>;

	// React Aria Components drops the anchor attributes it does not model, such as `title` and
	// `aria-expanded`. `render` puts the author's attributes under the ones it keeps, so it still
	// owns `href`, `rel`, `target`, handlers, and `ref`. Every branch below passes an `href`, so the
	// `span` fallback only satisfies the render type.
	const render: LinkProps['render'] = (domProps) =>
		'href' in domProps ? (
			<a {...props} {...domProps}>
				{domProps.children}
			</a>
		) : (
			<span {...domProps} />
		);

	if (EXTERNAL_HREF_PATTERN.test(href)) {
		const target = props.target ?? '_blank';
		return (
			<LukeLink
				{...props}
				href={href}
				rel={mergeRel(props.rel, target)}
				render={render}
				target={target}
			>
				{children}
			</LukeLink>
		);
	}

	// A same-page anchor needs no router. The browser scrolls to it.
	if (href.startsWith('#')) {
		return (
			<LukeLink {...props} href={href} render={render}>
				{children}
			</LukeLink>
		);
	}

	const { hash, path } = splitHash(href);
	return (
		<DocsLink {...props} hash={hash} render={render} to={path}>
			{children}
		</DocsLink>
	);
}

/** Adds `noreferrer noopener` to the author's `rel` tokens when the link opens a new browsing context. */
function mergeRel(rel: string | undefined, target: string) {
	const tokens = rel?.split(/\s+/).filter(Boolean) ?? [];
	if (target === '_blank') {
		for (const token of EXTERNAL_REL_TOKENS) {
			if (!tokens.includes(token)) tokens.push(token);
		}
	}
	return tokens.length > 0 ? tokens.join(' ') : undefined;
}

/** Builds the heading renderer for one level, with a link and a copy button when it has an `id`. */
export function createMdxHeading(level: HeadingLevel) {
	return function MdxHeading({
		children,
		id,
	}: Pick<ComponentPropsWithoutRef<'h2'>, 'children' | 'id'>) {
		if (id === undefined) {
			return (
				<Heading className={styles.heading} level={level}>
					{children}
				</Heading>
			);
		}

		// The copy button sits inside the heading to keep its spacing and alignment, so the heading
		// takes its name from the anchor alone. `:` cannot appear in a generated slug, so the anchor id
		// never collides with another heading's id.
		const titleId = `${id}:title`;
		return (
			<Heading aria-labelledby={titleId} className={styles.heading} id={id} level={level}>
				<a className={styles.headingAnchor} href={`#${id}`} id={titleId}>
					{children}
				</a>
				<CopyAnchorButton id={id} />
			</Heading>
		);
	};
}

function CopyAnchorButton({ id }: { id: string }) {
	const [copied, onCopy] = useCopyButton(() => {
		const url = new URL(window.location.href);
		url.hash = id;
		return navigator.clipboard.writeText(url.toString());
	});

	return (
		<span className={styles.headingCopyWrapper}>
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
	// Continue learning is an h2 in MDX; card titles step to h3 for the outline.
	return (
		<HeadingLevels base={3}>
			<Grid
				{...props}
				className={cx('not-prose', className)}
				columns="repeat(auto-fit, minmax(min(100%, 20rem), 1fr))"
				gap="sp12"
				marginBlockStart="sp40"
			/>
		</HeadingLevels>
	);
}

interface CardProps {
	/** Description text. `description` wins when both are set. */
	children?: ReactNode;
	description?: ReactNode;
	href: string;
	title: ReactNode;
}

/** Same card chrome as the components index: title, short description, whole-surface link. */
export function Card({ children, description, href, title }: CardProps) {
	return (
		<DocsCard
			description={
				<InheritTypographyContext value>{description ?? children}</InheritTypographyContext>
			}
			href={href}
			title={title}
		/>
	);
}

/** Splits `/path#hash` into the path and the hash TanStack Router takes as a separate prop. */
function splitHash(href: string) {
	const hashIndex = href.indexOf('#');
	if (hashIndex === -1) return { hash: undefined, path: href };
	return { hash: href.slice(hashIndex + 1) || undefined, path: href.slice(0, hashIndex) };
}

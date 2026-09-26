import { IconButton } from '@luke-ui/react/icon-button';
import { cx } from '@luke-ui/react/utils';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';
import { useEffect, useRef, useState } from 'react';
import * as styles from './code-block.css.js';

type FigureProps = ComponentPropsWithoutRef<'figure'>;

type CopyStatus = 'idle' | 'copied' | 'error';

const COPY_FEEDBACK_MS = 1500;

export interface CodeBlockProps extends Omit<FigureProps, 'children'> {
	/** Optional caption shown above the code. */
	title?: string;
	/**
	 * Shows the copy control. MDX may pass the string `"true"` / `"false"`.
	 * @default true
	 */
	allowCopy?: boolean | 'true' | 'false';
	/** Plain source. Prefer this over children when the text is a string constant. */
	code?: string;
	/** Shiki `<code>…</code>` markup. Docs CodeBlock owns the outer `<pre>`. */
	html?: string;
	/** Exact clipboard payload when rendered markup should not define what is copied. */
	copyText?: string;
	/** Drop outer margin and frame chrome so the block can sit flush under an example frame. */
	flush?: boolean;
	/** MDX `pre` children or other React nodes rendered inside `<pre>`. */
	children?: ReactNode;
	ref?: Ref<HTMLElement>;
}

/**
 * Docs-owned code block. Plain `code`, Shiki `html`, or MDX `children` all render through the same
 * chrome (title, copy, scroll region). Syntax highlighting stays in the docs Shiki pipeline.
 */
export function CodeBlock({
	allowCopy: allowCopyProp = true,
	children,
	className,
	code,
	copyText,
	flush = false,
	html,
	title,
	...figureProps
}: CodeBlockProps) {
	const allowCopy = allowCopyProp !== false && allowCopyProp !== 'false';
	const viewportRef = useRef<HTMLDivElement | null>(null);
	const resizeObserverRef = useRef<ResizeObserver | null>(null);
	const copyTimeoutRef = useRef<number | null>(null);
	const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

	useEffect(() => {
		return () => {
			if (copyTimeoutRef.current != null) window.clearTimeout(copyTimeoutRef.current);
		};
	}, []);

	async function handleCopy() {
		const text = resolveCopyText({
			code,
			copyText,
			viewport: viewportRef.current,
		});

		if (copyTimeoutRef.current != null) window.clearTimeout(copyTimeoutRef.current);

		try {
			await navigator.clipboard.writeText(text);
			setCopyStatus('copied');
		} catch {
			setCopyStatus('error');
		}

		copyTimeoutRef.current = window.setTimeout(() => {
			setCopyStatus('idle');
			copyTimeoutRef.current = null;
		}, COPY_FEEDBACK_MS);
	}

	const showOverlayCopy = allowCopy && title == null;
	const copyControl = allowCopy ? (
		<IconButton
			aria-label={copyStatus === 'copied' ? 'Copied' : 'Copy'}
			icon={copyStatus === 'copied' ? 'check' : 'copy'}
			onPress={handleCopy}
			prominence="low"
			size="small"
			tone="neutral"
		/>
	) : null;

	const liveMessage =
		copyStatus === 'copied' ? 'Copied' : copyStatus === 'error' ? 'Could not copy code' : '';

	return (
		// `not-prose` opts out of Fumadocs/Tailwind prose inline-code chrome on nested `code`.
		// `dir="ltr"` matches Fumadocs: scroll and overlay copy stay physical-right in RTL docs.
		<figure
			{...figureProps}
			className={cx(styles.root, 'not-prose', flush && styles.flush, className)}
			dir="ltr"
		>
			{title != null ? (
				<div className={styles.header}>
					<figcaption className={styles.title}>{title}</figcaption>
					{copyControl != null ? <div className={styles.actions}>{copyControl}</div> : null}
				</div>
			) : null}
			{showOverlayCopy && copyControl != null ? (
				<div className={cx(styles.actions, styles.overlayActions)}>{copyControl}</div>
			) : null}
			<div
				className={cx(styles.viewport, showOverlayCopy && styles.viewportWithOverlayCopy)}
				ref={(node) => {
					resizeObserverRef.current?.disconnect();
					resizeObserverRef.current = null;
					viewportRef.current = node;
					if (node == null) return;

					const updateTabIndex = () => {
						const scrollable =
							node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1;
						if (scrollable) {
							node.tabIndex = 0;
							node.setAttribute('role', 'region');
							node.setAttribute('aria-label', title ?? 'Code');
						} else {
							node.removeAttribute('tabindex');
							node.removeAttribute('role');
							node.removeAttribute('aria-label');
						}
					};

					updateTabIndex();
					const observer = new ResizeObserver(updateTabIndex);
					observer.observe(node);
					resizeObserverRef.current = observer;
				}}
			>
				{html != null ? (
					// Shiki escapes source before the highlight plugin emits this markup.
					<pre className={styles.pre} dangerouslySetInnerHTML={{ __html: html }} />
				) : (
					<pre className={styles.pre}>{code != null ? <code>{code}</code> : children}</pre>
				)}
			</div>
			{allowCopy ? (
				<VisuallyHidden aria-live="polite" elementType="p" role="status">
					{liveMessage}
				</VisuallyHidden>
			) : null}
		</figure>
	);
}

function resolveCopyText({
	code,
	copyText,
	viewport,
}: {
	code: string | undefined;
	copyText: string | undefined;
	viewport: HTMLDivElement | null;
}): string {
	if (copyText != null) return copyText;
	if (code != null) return code;

	const pre = viewport?.querySelector('pre');
	if (pre == null) return '';

	const clone = pre.cloneNode(true);
	if (clone instanceof HTMLElement) {
		for (const ignored of clone.querySelectorAll('.nd-copy-ignore')) {
			ignored.replaceWith('\n');
		}
		return clone.textContent ?? '';
	}

	return pre.textContent ?? '';
}

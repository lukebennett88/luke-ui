import { IconButton } from '@luke-ui/react/icon-button';
import { ScrollFade } from '@luke-ui/react/scroll-fade';
import { cx } from '@luke-ui/react/utils';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import { useObjectRef } from '@react-aria/utils';
import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';
import { useEffect, useReducer } from 'react';
import * as styles from './code-block.css.js';

type FigureProps = ComponentPropsWithoutRef<'figure'>;

type CopyStatus = 'idle' | 'copied' | 'error';

interface CodeBlockState {
	copyStatus: CopyStatus;
	/** Counts copy attempts so copying again during feedback restarts the timer. */
	copyAttempt: number;
}

type CodeBlockEvent =
	| { type: 'copySucceeded' }
	| { type: 'copyFailed' }
	| { type: 'copyFeedbackExpired' };

const COPY_FEEDBACK_MS = 1500;

const initialState: CodeBlockState = {
	copyStatus: 'idle',
	copyAttempt: 0,
};

export interface CodeBlockProps extends Omit<FigureProps, 'children'> {
	/**
	 * Shows the copy control. MDX may pass the string `"true"` / `"false"`.
	 * @default true
	 */
	allowCopy?: boolean | 'true' | 'false';
	/** MDX `pre` children or other React nodes rendered inside `<pre>`. */
	children?: ReactNode;
	/** Plain source. Prefer this over children when the text is a string constant. */
	code?: string;
	/** Exact clipboard payload when rendered markup should not define what is copied. */
	copyText?: string;
	/** Drop outer margin and frame chrome so the block can sit flush under an example frame. */
	flush?: boolean;
	/** Shiki `<code>…</code>` markup. Docs CodeBlock owns the outer `<pre>`. */
	html?: string;
	ref?: Ref<HTMLElement>;
	/** Ref for the source `<pre>` element. */
	sourceRef?: Ref<HTMLPreElement>;
	/** Optional caption shown above the code. */
	title?: string;
	/** Accessible name for the scroll region. Defaults to the title or "Code". */
	viewportLabel?: string;
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
	sourceRef,
	title,
	viewportLabel = title ?? 'Code',
	...figureProps
}: CodeBlockProps) {
	const allowCopy = allowCopyProp !== false && allowCopyProp !== 'false';
	const sourceElementRef = useObjectRef(sourceRef);
	const [{ copyAttempt, copyStatus }, dispatch] = useReducer(codeBlockReducer, initialState);

	useEffect(() => {
		if (copyStatus === 'idle') return;
		const timeout = window.setTimeout(
			() => dispatch({ type: 'copyFeedbackExpired' }),
			COPY_FEEDBACK_MS,
		);
		return () => window.clearTimeout(timeout);
		// `copyAttempt` restarts the timer when someone copies again during feedback.
	}, [copyStatus, copyAttempt]);

	async function handleCopy() {
		const text = resolveCopyText({
			code,
			copyText,
			sourceElement: sourceElementRef.current,
		});

		try {
			await navigator.clipboard.writeText(text);
			dispatch({ type: 'copySucceeded' });
		} catch {
			dispatch({ type: 'copyFailed' });
		}
	}

	const showOverlayCopy = allowCopy && title == null;
	const copyControl = allowCopy ? (
		<IconButton
			aria-label={copyStatus === 'copied' ? 'Copied' : 'Copy'}
			icon={copyStatus === 'copied' ? 'check' : 'copy'}
			onPress={handleCopy}
			prominence="low"
			size="px32"
			tone="neutral"
		/>
	) : null;

	const liveMessage =
		copyStatus === 'copied' ? 'Copied' : copyStatus === 'error' ? 'Could not copy code' : '';

	return (
		// `not-prose` keeps Luke UI Prose spacing, list, and table rules out of the code block.
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
			<ScrollFade
				aria-label={viewportLabel}
				className={cx(styles.viewport, showOverlayCopy && styles.viewportWithOverlayCopy)}
			>
				{html != null ? (
					// Shiki escapes source before the highlight plugin emits this markup.
					<pre
						className={styles.pre}
						dangerouslySetInnerHTML={{ __html: html }}
						ref={sourceElementRef}
					/>
				) : (
					<pre className={styles.pre} ref={sourceElementRef}>
						{code != null ? <code>{code}</code> : children}
					</pre>
				)}
			</ScrollFade>
			{allowCopy ? (
				<VisuallyHidden aria-live="polite" elementType="p" role="status">
					{liveMessage}
				</VisuallyHidden>
			) : null}
		</figure>
	);
}

function codeBlockReducer(state: CodeBlockState, event: CodeBlockEvent): CodeBlockState {
	switch (event.type) {
		case 'copySucceeded':
			return { ...state, copyStatus: 'copied', copyAttempt: state.copyAttempt + 1 };
		case 'copyFailed':
			return { ...state, copyStatus: 'error', copyAttempt: state.copyAttempt + 1 };
		case 'copyFeedbackExpired':
			return { ...state, copyStatus: 'idle' };
	}
}

function resolveCopyText({
	code,
	copyText,
	sourceElement,
}: {
	code: string | undefined;
	copyText: string | undefined;
	sourceElement: HTMLPreElement | null;
}): string {
	if (copyText != null) return copyText;
	if (code != null) return code;

	if (sourceElement == null) return '';

	const clone = sourceElement.cloneNode(true);
	if (clone instanceof HTMLElement) {
		for (const ignored of clone.querySelectorAll('.nd-copy-ignore')) {
			ignored.replaceWith('\n');
		}
		return clone.textContent ?? '';
	}

	return sourceElement.textContent ?? '';
}

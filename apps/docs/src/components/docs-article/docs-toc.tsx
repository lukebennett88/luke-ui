import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import { cx } from '@luke-ui/react/utils';
import { useActiveAnchor } from 'fumadocs-core/toc';
import type { TOCItemType } from 'fumadocs-core/toc';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { docsNavPaneProps } from '../docs-nav.js';
import * as styles from './docs-article.css.js';

const TOC_LABEL = 'On this page';

const tocListBorder = {
	borderInlineStart: `1px solid ${vars.color.border.decorative}`,
} as const satisfies CSSProperties;

const tocLinkPaddingInlineStart = {
	top: 'sp12',
	nested: 'sp24',
	deep: 'sp40',
} as const;

/** Sticky table of contents shown in its own column at wide viewports. */
export function DocsTocColumn({ toc }: { toc: Array<TOCItemType> }) {
	return (
		<Box
			{...docsNavPaneProps}
			aria-label={TOC_LABEL}
			className={styles.tocColumn}
			elementType="nav"
		>
			<Stack gap="sp8">
				<Box paddingInline="sp8">
					<Text color="secondary" elementType="p" typography="label">
						{TOC_LABEL}
					</Text>
				</Box>
				<TocLinks toc={toc} />
			</Stack>
		</Box>
	);
}

/** Disclosure that holds the table of contents below the wide breakpoint. */
export function DocsTocBar({ toc }: { toc: Array<TOCItemType> }) {
	const detailsRef = useRef<HTMLDetailsElement>(null);

	function close() {
		if (detailsRef.current) detailsRef.current.open = false;
	}

	// Escape closes the panel from anywhere inside it and returns focus to the summary. A press
	// outside the disclosure closes it too, because the open panel overlays the article.
	useEffect(() => {
		const details = detailsRef.current;
		if (!details) return;
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key !== 'Escape' || !details?.open) return;
			details.open = false;
			details.querySelector('summary')?.focus();
		}
		function handlePointerDown(event: PointerEvent) {
			if (event.target instanceof Node && !details?.contains(event.target)) close();
		}
		details.addEventListener('keydown', handleKeyDown);
		document.addEventListener('pointerdown', handlePointerDown);
		return () => {
			details.removeEventListener('keydown', handleKeyDown);
			document.removeEventListener('pointerdown', handlePointerDown);
		};
	}, []);

	return (
		<details className={styles.tocBar} ref={detailsRef}>
			<summary className={styles.tocSummary}>
				{TOC_LABEL}
				<Icon className={styles.tocSummaryIcon} name="chevronDown" size="xsmall" />
			</summary>
			<nav aria-label={TOC_LABEL} className={styles.tocBarPanel}>
				<Box paddingBlock="sp8">
					<TocLinks onNavigate={close} toc={toc} />
				</Box>
			</nav>
		</details>
	);
}

function TocLinks({ onNavigate, toc }: { onNavigate?: () => void; toc: Array<TOCItemType> }) {
	const activeId = useActiveAnchor();

	return (
		<Box elementType="ul" style={tocListBorder}>
			{toc.map((item) => (
				<Box elementType="li" key={item.url}>
					<TocLink
						href={item.url}
						isCurrent={item.url === `#${activeId}`}
						onNavigate={onNavigate}
						paddingInlineStart={tocLinkPaddingInlineStart[tocDepth(item.depth)]}
					>
						{item.title}
					</TocLink>
				</Box>
			))}
		</Box>
	);
}

function TocLink({
	children,
	href,
	isCurrent,
	onNavigate,
	paddingInlineStart,
}: {
	children: ReactNode;
	href: string;
	isCurrent: boolean;
	onNavigate?: () => void;
	paddingInlineStart: (typeof tocLinkPaddingInlineStart)[keyof typeof tocLinkPaddingInlineStart];
}) {
	return (
		<Box
			display="block"
			paddingBlock="sp4"
			paddingInlineEnd="sp8"
			paddingInlineStart={paddingInlineStart}
			renderRoot={(domProps) => (
				<a
					{...domProps}
					aria-current={isCurrent ? 'location' : undefined}
					className={cx(domProps.className, styles.tocLink)}
					href={href}
					onClick={onNavigate}
				>
					{domProps.children}
				</a>
			)}
		>
			{children}
		</Box>
	);
}

/** Heading depth 2 sits flush. Each deeper level indents one step, capped at two. */
function tocDepth(depth: number): keyof typeof tocLinkPaddingInlineStart {
	if (depth <= 2) return 'top';
	return depth === 3 ? 'nested' : 'deep';
}

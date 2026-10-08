import { Icon } from '@luke-ui/react/icon';
import { Text } from '@luke-ui/react/text';
import { useActiveAnchor } from 'fumadocs-core/toc';
import type { TOCItemType } from 'fumadocs-core/toc';
import { useEffect, useRef } from 'react';
import * as styles from './docs-article.css.js';

const TOC_LABEL = 'On this page';

/** Sticky table of contents shown in its own column at wide viewports. */
export function DocsTocColumn({ toc }: { toc: Array<TOCItemType> }) {
	return (
		<nav aria-label={TOC_LABEL} className={styles.tocColumn}>
			<Text className={styles.tocTitle} color="secondary" elementType="p" typography="label">
				{TOC_LABEL}
			</Text>
			<TocLinks toc={toc} />
		</nav>
	);
}

/** Disclosure that holds the table of contents below the wide breakpoint. */
export function DocsTocBar({ toc }: { toc: Array<TOCItemType> }) {
	const detailsRef = useRef<HTMLDetailsElement>(null);

	function close() {
		if (detailsRef.current) detailsRef.current.open = false;
	}

	// Escape closes the panel from anywhere inside it and returns focus to the summary.
	useEffect(() => {
		const details = detailsRef.current;
		if (!details) return;
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key !== 'Escape' || !details?.open) return;
			details.open = false;
			details.querySelector('summary')?.focus();
		}
		details.addEventListener('keydown', handleKeyDown);
		return () => details.removeEventListener('keydown', handleKeyDown);
	}, []);

	return (
		<details className={styles.tocBar} ref={detailsRef}>
			<summary className={styles.tocSummary}>
				{TOC_LABEL}
				<Icon className={styles.tocSummaryIcon} name="chevronDown" />
			</summary>
			<nav aria-label={TOC_LABEL} className={styles.tocBarPanel}>
				<TocLinks onNavigate={close} toc={toc} />
			</nav>
		</details>
	);
}

function TocLinks({ onNavigate, toc }: { onNavigate?: () => void; toc: Array<TOCItemType> }) {
	const activeId = useActiveAnchor();

	return (
		<ul className={styles.tocList}>
			{toc.map((item) => (
				<li key={item.url}>
					<a
						aria-current={item.url === `#${activeId}` ? 'location' : undefined}
						className={styles.tocLink}
						data-depth={tocDepth(item.depth)}
						href={item.url}
						onClick={onNavigate}
					>
						{item.title}
					</a>
				</li>
			))}
		</ul>
	);
}

/** Heading depth 2 sits flush. Each deeper level indents one step, capped at two. */
function tocDepth(depth: number) {
	if (depth <= 2) return 'top';
	return depth === 3 ? 'nested' : 'deep';
}

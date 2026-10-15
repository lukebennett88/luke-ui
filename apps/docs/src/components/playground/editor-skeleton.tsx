import { Cluster } from '@luke-ui/react/cluster';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { Track } from '@luke-ui/react/track';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import shapeScript from '../../generated/editor-skeleton-script.iife.js?raw';
import { toSkeletonLines } from '../../lib/playground-editor-shape.js';
import * as styles from './playground.css.js';

/**
 * Placeholder that mirrors the code the editor is about to show: one bar per
 * line, matching each line's indentation and length. Metrics (font, line
 * height, gutter, padding) are kept in sync with the Monaco options in
 * `editor.tsx` so the swap to the real editor lands every line where its bar
 * was. `showPill` is owned by the page so the indicator stays stable while the
 * skeleton remounts across loading phases (SSR fallback → Suspense → Monaco
 * init).
 */
export function EditorSkeleton({ code, showPill }: { code: string; showPill: boolean }) {
	return (
		<div className={styles.editorSkeleton} role="status">
			<VisuallyHidden>Loading editor</VisuallyHidden>
			{toSkeletonLines(code).map((line, index) => (
				<div aria-hidden className={styles.skeletonLine} data-line key={index}>
					<span className={styles.skeletonLineNumber} data-line-number>
						{index + 1}
					</span>
					<span className={styles.skeletonLineContent}>
						{line.length > 0 ? (
							// Sized via custom properties (not style properties) so
							// editor-skeleton-script.js can write byte-identical inline
							// styles — camelCase style keys would trip hydration diffing.
							<LoadingSkeleton
								className={styles.skeletonBar}
								data-line-bar
								style={{
									// @ts-expect-error custom properties are not in the style type
									'--indent': `${line.indent}ch`,
									'--length': `${line.length}ch`,
								}}
							/>
						) : null}
					</span>
				</div>
			))}
			{showPill ? (
				<Cluster aria-hidden className={styles.skeletonPillOverlay} justifyContent="center">
					<LoadingPill label="Loading editor" />
				</Cluster>
			) : null}
		</div>
	);
}

/**
 * Rewrites the server-rendered skeleton to the shape of the shared code before
 * first paint; see `editor-skeleton-script.ts` (compiled by `vp pack` during
 * `docs#generate`, inlined via `?raw`). Render it in the pre-hydration
 * fallback only, directly after the skeleton — the script finds its skeleton
 * as `document.currentScript.previousElementSibling`.
 */
export function EditorSkeletonShapeScript() {
	return (
		// oxlint-disable-next-line react/no-danger -- static, fully inlined script; nothing user-controlled beyond digits.
		<script dangerouslySetInnerHTML={{ __html: shapeScript }} />
	);
}

/** Shared loading indicator so the editor and preview speak the same language. */
export function LoadingPill({ label }: { label: string }) {
	return (
		<Track
			className={styles.loadingPill}
			gap="sp8"
			railAlignment="firstLine"
			railStart={<LoadingSpinner aria-hidden size="small" />}
		>
			{label}
		</Track>
	);
}

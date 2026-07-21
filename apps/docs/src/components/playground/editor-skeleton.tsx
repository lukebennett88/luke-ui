import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { css } from '../../../styled-system/css';
import shapeScript from '../../generated/editor-skeleton-script.iife.js?raw';
import { toSkeletonLines } from '../../lib/playground-shape';

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
		<div
			className="relative size-full overflow-hidden pt-3 font-mono text-[13px] leading-5"
			role="status"
		>
			<span className="sr-only">Loading editor</span>
			{toSkeletonLines(code).map((line, index) => (
				<div aria-hidden className="flex h-5 items-center" data-line key={index}>
					<span
						className="w-[3ch] shrink-0 text-right text-[#8c8fa1] dark:text-[#7f849c]"
						data-line-number
					>
						{index + 1}
					</span>
					<span className="min-w-0 flex-1 overflow-hidden pr-4 pl-2.5">
						{line.length > 0 ? (
							// Sized via custom properties (not style properties) so
							// editor-skeleton-script.js can write byte-identical inline
							// styles — camelCase style keys would trip hydration diffing.
							<LoadingSkeleton
								className="ms-(--indent) block h-3 w-(--length)"
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
				<div aria-hidden className="absolute inset-0 flex items-center justify-center">
					<LoadingPill label="Loading editor" />
				</div>
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
		<div className={loadingPillStyle}>
			<LoadingSpinner aria-hidden size="small" />
			<span>{label}</span>
		</div>
	);
}

const loadingPillStyle = css({
	alignItems: 'center',
	backgroundColor: 'var(--luke-color-surface-resting)',
	borderColor: 'var(--luke-color-border-decorative)',
	borderRadius: 'var(--luke-radius-full)',
	borderStyle: 'solid',
	borderWidth: '1px',
	color: 'var(--luke-color-text-secondary)',
	display: 'flex',
	fontSize: 'var(--luke-font-100-font-size)',
	gap: 'var(--luke-space-200)',
	paddingBlock: 'var(--luke-space-150)',
	paddingInline: 'var(--luke-space-300)',
});

import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { cx } from '@luke-ui/react/utils';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { startTransition, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { CodeBlock } from './code-block/code-block.js';
import * as styles from './example-code-preview.css.js';

export function ExampleCodePreview({
	html,
	source,
	title,
}: {
	html: string;
	source: string;
	title: string;
}) {
	const [{ focus, mode }, dispatch] = useReducer(sourceReducer, initialSourceState);
	const sourceRef = useRef<HTMLPreElement>(null);
	const copyButtonRef = useRef<HTMLButtonElement>(null);
	const toggleRef = useRef<HTMLButtonElement>(null);
	/** Viewport top of the toggle when a collapse was requested. */
	const collapseToggleTopRef = useRef<number | null>(null);
	const [sourceClipBlockSizes, setSourceClipBlockSizes] = useState<{
		collapsed: number;
		expanded: number;
	} | null>(null);
	const isExpanded = mode === 'expanded';
	const canExpand = mode === 'collapsed' || isExpanded;
	const isClipped = !isExpanded;

	useLayoutEffect(() => {
		const sourceElement = sourceRef.current;
		if (!sourceElement) return;

		const update = () => {
			const isClipped = measureIsClipped(sourceElement);
			if (isClipped != null) dispatch({ isClipped, type: 'measured' });
			const collapsed = measureCollapsedSourceBlockSize(sourceElement);
			if (collapsed != null) {
				setSourceClipBlockSizes({
					collapsed,
					expanded: measureExpandedSourceBlockSize(sourceElement),
				});
			}
		};

		const observer = new ResizeObserver(update);
		observer.observe(sourceElement);
		// Measure on the next frame to avoid a render during effect setup.
		const frame = requestAnimationFrame(update);
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
		};
	}, []);

	// Collapsed styles can land without a size change (for example after
	// shrinking typography while expanded). Remeasure once they apply.
	useLayoutEffect(() => {
		if (mode !== 'collapsed') return;
		const sourceElement = sourceRef.current;
		if (!sourceElement) return;

		const isClipped = measureIsClipped(sourceElement);
		if (isClipped != null) dispatch({ isClipped, type: 'measured' });
		const collapsed = measureCollapsedSourceBlockSize(sourceElement);
		if (collapsed != null) {
			setSourceClipBlockSizes({
				collapsed,
				expanded: measureExpandedSourceBlockSize(sourceElement),
			});
		}
	}, [mode]);

	// Collapsing shrinks the source above the toggle without changing the page scroll. When the
	// reader has scrolled past the source's top, scroll by the toggle's shift so they keep their
	// place. Native scroll anchoring picks a source line that the collapse clips, so it cannot do
	// this. While the top is still visible, the press skips recording and the page stays put.
	useLayoutEffect(() => {
		const topBefore = collapseToggleTopRef.current;
		collapseToggleTopRef.current = null;
		const toggle = toggleRef.current;
		if (mode !== 'collapsed' || topBefore == null || !toggle) return;
		window.scrollBy({ behavior: 'instant', top: toggle.getBoundingClientRect().top - topBefore });
	}, [mode]);

	// The reducer asks for this only after a focused collapse control has unmounted.
	useLayoutEffect(() => {
		if (focus !== 'copy') return;
		copyButtonRef.current?.focus();
		dispatch({ type: 'focusRestored' });
	}, [focus]);

	const sourceClipStyle =
		canExpand && sourceClipBlockSizes != null
			? assignInlineVars({
					[styles.sourceMaxBlockSizeVar]: `${
						isExpanded ? sourceClipBlockSizes.expanded : sourceClipBlockSizes.collapsed
					}px`,
				})
			: undefined;

	return (
		<Box
			backgroundColor="surface.subdued"
			data-example-code-frame
			overflow="hidden"
			paddingBlockEnd={canExpand ? 'sp48' : undefined}
			position="relative"
			style={sourceClipStyle}
		>
			{/* Shiki escapes the source before the Vite plugin generates this HTML. */}
			<CodeBlock
				copyButtonRef={copyButtonRef}
				copyText={source}
				flush
				html={html}
				sourceRef={sourceRef}
				viewportClassName={cx(
					// Clip while measuring and before pixel sizes land. Once expand/collapse is
					// available, keep an explicit max-block-size in both states so height can transition.
					canExpand && sourceClipBlockSizes != null
						? styles.codeViewportAnimatable
						: isClipped && styles.codeViewportCollapsedFallback,
					canExpand && isClipped && styles.codeViewportFade,
				)}
				viewportLabel={`${title} code`}
			/>
			{canExpand ? (
				<Box
					display="flex"
					insetBlockEnd="sp8"
					insetInlineStart="50%"
					justifyContent="center"
					position="absolute"
					style={{
						transform: 'translateX(-50%)',
						zIndex: 1,
					}}
				>
					<Button
						// React ignores the blur from unmounting, so this only sees focus moving away.
						onBlur={() => dispatch({ type: 'toggleBlurred' })}
						onFocus={() => dispatch({ type: 'toggleFocused' })}
						onPress={(event) => {
							const target = event.target;
							collapseToggleTopRef.current =
								isExpanded && sourceRef.current && isUnderSiteHeader(sourceRef.current)
									? target.getBoundingClientRect().top
									: null;
							// Commit after this activation's keyup listeners so a focus move during
							// the same Enter can still decide whether to restore Copy.
							startTransition(() => {
								const hadFocus = target === document.activeElement;
								dispatch(isExpanded ? { hadFocus, type: 'collapse' } : { type: 'expand' });
							});
						}}
						ref={toggleRef}
						size="small"
					>
						{isExpanded ? 'Collapse code' : 'Expand code'}
					</Button>
				</Box>
			) : null}
		</Box>
	);
}

/** Whether the reader has scrolled the source's top edge up under the sticky docs header. */
function isUnderSiteHeader(sourceElement: HTMLElement) {
	return sourceElement.getBoundingClientRect().top < siteHeaderBottom();
}

/** Live bottom edge of the sticky docs header, or the viewport top when the shell is absent. */
function siteHeaderBottom() {
	const header = document.querySelector<HTMLElement>('#docs-shell [data-docs-sticky-header]');
	return header?.getBoundingClientRect().bottom ?? 0;
}

function measureExpandedSourceBlockSize(sourceElement: HTMLElement) {
	return sourceElement.scrollHeight;
}

function measureCollapsedSourceBlockSize(sourceElement: HTMLElement) {
	const lineHeight = Number.parseFloat(getComputedStyle(sourceElement).lineHeight);
	if (!Number.isFinite(lineHeight)) return null;
	return lineHeight * styles.collapsedSourceLineCount;
}

/**
 * Whether the collapsed clip (`overflow-y: clip`) cuts off source lines. Returns `undefined` while
 * the clip is not applied (for example when a resize callback fires for the expanded DOM just as a collapse is
 * queued), because that measurement says nothing about the collapsed source.
 */
function measureIsClipped(sourceElement: HTMLElement) {
	if (getComputedStyle(sourceElement).overflowY !== 'clip') return undefined;
	return sourceElement.scrollHeight > sourceElement.clientHeight + 1;
}

interface SourceState {
	mode: 'unmeasured' | 'fits' | 'collapsed' | 'expanded';
	/**
	 * Only a pending collapse can request restoration. Remember blur until measurement so focus
	 * returning before commit can reinstate the request.
	 */
	focus: 'none' | 'copy-if-fits' | 'collapse-blurred' | 'copy';
}

type SourceEvent =
	| { isClipped: boolean; type: 'measured' }
	| { type: 'expand' }
	| { hadFocus: boolean; type: 'collapse' }
	| { type: 'toggleBlurred' }
	| { type: 'toggleFocused' }
	| { type: 'focusRestored' };

const initialSourceState: SourceState = { focus: 'none', mode: 'unmeasured' };

function sourceReducer(state: SourceState, event: SourceEvent): SourceState {
	switch (event.type) {
		case 'measured': {
			// Expanded source fits by definition. Keep its collapse control until it is collapsed.
			if (state.mode === 'expanded') return state;
			const mode = event.isClipped ? 'collapsed' : 'fits';
			let focus = state.focus;
			if (event.isClipped || focus === 'collapse-blurred') focus = 'none';
			else if (focus === 'copy-if-fits') focus = 'copy';
			return mode === state.mode && focus === state.focus ? state : { focus, mode };
		}
		case 'expand':
			return state.mode === 'collapsed' ? { focus: 'none', mode: 'expanded' } : state;
		case 'collapse':
			return state.mode === 'expanded'
				? { focus: event.hadFocus ? 'copy-if-fits' : 'none', mode: 'collapsed' }
				: state;
		case 'toggleBlurred':
			return state.focus === 'copy-if-fits' ? { ...state, focus: 'collapse-blurred' } : state;
		case 'toggleFocused':
			return state.focus === 'collapse-blurred' ? { ...state, focus: 'copy-if-fits' } : state;
		case 'focusRestored':
			return state.focus === 'copy' ? { ...state, focus: 'none' } : state;
	}
}

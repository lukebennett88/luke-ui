import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { cx } from '@luke-ui/react/utils';
import { startTransition, useLayoutEffect, useReducer, useRef } from 'react';
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
	/**
	 * Viewport top to hold the toggle at while grid-template-rows animates. The height change
	 * would move the frame bottom; scrolling by the same delta keeps the control still so the
	 * clip window opens and closes against a fixed sill.
	 */
	const pinnedToggleTopRef = useRef<number | null>(null);
	/** rAF id for the active sill pin (starts on press so startTransition cannot outrun it). */
	const pinFrameRef = useRef(0);
	const isExpanded = mode === 'expanded';
	const canExpand = mode === 'collapsed' || isExpanded;
	const isClipped = !isExpanded;

	useLayoutEffect(() => {
		const sourceElement = sourceRef.current;
		if (!sourceElement) return;

		const update = () => {
			const isClipped = measureIsClipped(sourceElement);
			if (isClipped != null) dispatch({ isClipped, type: 'measured' });
		};

		const observer = new ResizeObserver(update);
		observer.observe(sourceElement);
		// Collapsed preview floors the pre with min-block-size, so typography changes that shrink
		// content may not resize the pre itself — observe children (the content box) too.
		for (const child of sourceElement.children) {
			observer.observe(child);
		}
		// Measure on the next frame to avoid a render during effect setup.
		const frame = requestAnimationFrame(update);
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
		};
	}, []);

	// Collapsed styles can land without a size change (for example after shrinking typography while
	// expanded). Remeasure once they apply. Clip is judged from content vs the collapsed line budget,
	// so a mid-flight grid row does not look like a fit.
	useLayoutEffect(() => {
		if (mode !== 'collapsed') return;
		const sourceElement = sourceRef.current;
		if (!sourceElement) return;

		const isClipped = measureIsClipped(sourceElement);
		if (isClipped != null) dispatch({ isClipped, type: 'measured' });
	}, [mode]);

	// Keep the toggle still while height transitions. The scrollport grid animates
	// `grid-template-rows` between `0fr` (six-line floor on the child) and `1fr`; each frame,
	// scroll by the sill's drift so it stays put while bottom lines are clipped or disclosed.
	// Pinning begins in onPress (below) so startTransition cannot leave a gap before this effect.
	useLayoutEffect(() => {
		const pinnedTop = pinnedToggleTopRef.current;
		const toggle = toggleRef.current;
		const sourceElement = sourceRef.current;
		const viewport = sourceElement?.parentElement;
		if (pinnedTop == null || !toggle || !viewport) return;

		let finished = false;
		const durationMs = Number.parseFloat(getComputedStyle(viewport).transitionDuration);
		// Computed transition-duration is seconds (e.g. `0.25s`). Fall back to one frame when 0.
		const pinForMs = Number.isFinite(durationMs) ? Math.max(durationMs * 1000, 16) : 250;
		const startedAt = performance.now();

		const isCurrentPin = () => pinnedToggleTopRef.current === pinnedTop;

		const pinToggle = () => {
			if (!isCurrentPin()) return;
			const delta = toggle.getBoundingClientRect().top - pinnedTop;
			if (Math.abs(delta) >= 0.5) {
				window.scrollBy({ behavior: 'instant', top: delta });
			}
		};

		const stop = () => {
			if (finished) return;
			finished = true;
			pinToggle();
			if (isCurrentPin()) {
				pinnedToggleTopRef.current = null;
			}
		};

		const tick = () => {
			if (finished || !isCurrentPin()) return;
			pinToggle();
			if (performance.now() - startedAt < pinForMs + 32) {
				pinFrameRef.current = requestAnimationFrame(tick);
				return;
			}
			stop();
		};

		pinToggle();
		pinFrameRef.current = requestAnimationFrame(tick);

		// Only `transitionend` — reversing expand→collapse cancels the prior transition and would
		// stop the pin while the new row animation is still running.
		const onEnd = (event: TransitionEvent) => {
			if (event.target === viewport && event.propertyName === 'grid-template-rows') stop();
		};
		viewport.addEventListener('transitionend', onEnd);

		return () => {
			finished = true;
			viewport.removeEventListener('transitionend', onEnd);
			// Do not cancel pinFrameRef: a newer press may already own the loop.
		};
	}, [mode]);

	// The reducer asks for this only after a focused collapse control has unmounted.
	useLayoutEffect(() => {
		if (focus !== 'copy') return;
		copyButtonRef.current?.focus();
		dispatch({ type: 'focusRestored' });
	}, [focus]);

	return (
		<Box
			backgroundColor="surface.subdued"
			data-example-code-frame
			overflow="hidden"
			paddingBlockEnd={canExpand ? 'sp48' : undefined}
			position="relative"
		>
			{/* Shiki escapes the source before the Vite plugin generates this HTML. */}
			<CodeBlock
				copyButtonRef={copyButtonRef}
				copyText={source}
				flush
				html={html}
				sourceRef={sourceRef}
				viewportClassName={cx(
					canExpand && styles.codeViewportAnimatable,
					isClipped && styles.codeViewportCollapsed,
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
							const pinnedTop = target.getBoundingClientRect().top;
							pinnedToggleTopRef.current = pinnedTop;
							// Pin immediately — collapse/expand commit inside startTransition below.
							cancelAnimationFrame(pinFrameRef.current);
							const eagerPin = () => {
								const toggle = toggleRef.current;
								if (pinnedToggleTopRef.current !== pinnedTop || !toggle) return;
								const delta = toggle.getBoundingClientRect().top - pinnedTop;
								if (Math.abs(delta) >= 0.5) {
									window.scrollBy({ behavior: 'instant', top: delta });
								}
								pinFrameRef.current = requestAnimationFrame(eagerPin);
							};
							pinFrameRef.current = requestAnimationFrame(eagerPin);
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

/**
 * Whether the collapsed clip would cut off source lines. Uses the content box (the inner `code`,
 * not the pre's border box floored by min-block-size) vs the CSS collapsed budget, so an in-flight
 * grid row cannot look like a fit. Returns `undefined` while the clip is not applied (for example
 * when a resize callback fires for the expanded DOM just as a collapse is queued).
 */
function measureIsClipped(sourceElement: HTMLElement) {
	if (getComputedStyle(sourceElement).overflowY !== 'clip') return undefined;
	const contentBlockSize = measureSourceContentBlockSizePx(sourceElement);
	const collapsedMax = measureCollapsedMaxBlockSizePx(sourceElement);
	if (collapsedMax != null) {
		return contentBlockSize > collapsedMax + 1;
	}
	return contentBlockSize > sourceElement.clientHeight + 1;
}

/** Content height inside the pre, ignoring the collapsed min-block-size floor on the pre itself. */
function measureSourceContentBlockSizePx(sourceElement: HTMLElement) {
	const content = sourceElement.firstElementChild;
	if (content instanceof HTMLElement) {
		return content.getBoundingClientRect().height;
	}
	return sourceElement.scrollHeight;
}

/** Resolved px for the collapsed budget custom property (not the in-flight grid track). */
function measureCollapsedMaxBlockSizePx(sourceElement: HTMLElement) {
	const varReference = styles.collapsedSourceMaxBlockSizeVar;
	const probe = sourceElement.ownerDocument.createElement('div');
	probe.style.cssText = `position:absolute;visibility:hidden;block-size:${varReference};`;
	sourceElement.append(probe);
	const size = Number.parseFloat(getComputedStyle(probe).blockSize);
	probe.remove();
	return Number.isFinite(size) ? size : null;
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

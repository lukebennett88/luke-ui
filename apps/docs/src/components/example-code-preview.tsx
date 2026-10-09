import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { cx } from '@luke-ui/react/utils';
import {
	addTransitionType,
	startTransition,
	useId,
	useLayoutEffect,
	useReducer,
	useRef,
	ViewTransition,
} from 'react';
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
	const codeId = useId();
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
	}, [mode]);

	// The reducer asks for this only after a focused collapse control has unmounted.
	useLayoutEffect(() => {
		if (focus !== 'copy') return;
		copyButtonRef.current?.focus();
		dispatch({ type: 'focusRestored' });
	}, [focus]);

	return (
		<ViewTransition default="none" update={styles.codeUpdate}>
			<Box
				backgroundColor="surface.subdued"
				id={codeId}
				overflow="hidden"
				paddingBlockEnd={canExpand ? 'sp40' : undefined}
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
						styles.codeViewport,
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
							aria-controls={codeId}
							aria-expanded={isExpanded}
							// React ignores the blur from unmounting, so this only sees focus moving away.
							onBlur={() => dispatch({ type: 'toggleBlurred' })}
							onPress={(event) => {
								// Read focus at press time. A view transition can move it to body before effects run.
								const hadFocus = event.target === document.activeElement;
								startTransition(() => {
									addTransitionType(styles.codeTransitionType);
									dispatch(isExpanded ? { hadFocus, type: 'collapse' } : { type: 'expand' });
								});
							}}
							size="small"
						>
							{isExpanded ? 'Collapse code' : 'Expand code'}
						</Button>
					</Box>
				) : null}
			</Box>
		</ViewTransition>
	);
}

/**
 * Whether the collapsed clip cuts off source lines. Returns `undefined` while the clip is not
 * applied (for example when a resize callback fires for the expanded DOM just as a collapse is
 * queued), because that measurement says nothing about the collapsed source.
 */
function measureIsClipped(sourceElement: HTMLElement) {
	if (getComputedStyle(sourceElement).overflowY !== 'hidden') return undefined;
	return sourceElement.scrollHeight > sourceElement.clientHeight + 1;
}

interface SourceState {
	mode: 'unmeasured' | 'fits' | 'collapsed' | 'expanded';
	/**
	 * Where focus should land once the collapse control may have gone. `copy-if-fits` waits for the
	 * next measurement and is dropped if focus leaves the toggle first, `copy` asks the component to
	 * move focus, and `none` leaves focus alone.
	 */
	focus: 'none' | 'copy-if-fits' | 'copy';
}

type SourceEvent =
	| { isClipped: boolean; type: 'measured' }
	| { type: 'expand' }
	| { hadFocus: boolean; type: 'collapse' }
	| { type: 'toggleBlurred' }
	| { type: 'focusRestored' };

const initialSourceState: SourceState = { focus: 'none', mode: 'unmeasured' };

function sourceReducer(state: SourceState, event: SourceEvent): SourceState {
	switch (event.type) {
		case 'measured': {
			// Expanded source fits by definition. Keep its collapse control until it is collapsed.
			if (state.mode === 'expanded') return state;
			const mode = event.isClipped ? 'collapsed' : 'fits';
			let focus = state.focus;
			if (event.isClipped) focus = 'none';
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
			return state.focus === 'copy-if-fits' ? { ...state, focus: 'none' } : state;
		case 'focusRestored':
			return state.focus === 'copy' ? { ...state, focus: 'none' } : state;
	}
}

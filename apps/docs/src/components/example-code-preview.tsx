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
	const [mode, dispatch] = useReducer(sourceReducer, 'unmeasured');
	const sourceRef = useRef<HTMLPreElement>(null);
	const codeId = useId();
	const isExpanded = mode === 'expanded';
	const canExpand = mode === 'collapsed' || isExpanded;
	const isClipped = !isExpanded;

	useLayoutEffect(() => {
		const sourceElement = sourceRef.current;
		if (!sourceElement) return;

		const update = () => {
			dispatch({
				isClipped: sourceElement.scrollHeight > sourceElement.clientHeight + 1,
				type: 'measured',
			});
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

		dispatch({
			isClipped: sourceElement.scrollHeight > sourceElement.clientHeight + 1,
			type: 'measured',
		});
	}, [mode]);

	return (
		<ViewTransition default="none" update={styles.codeUpdate}>
			<Box
				backgroundColor="surface.recessed"
				id={codeId}
				overflow="hidden"
				paddingBlockEnd={canExpand ? 'sp40' : undefined}
				position="relative"
			>
				{/* Shiki escapes the source before the Vite plugin generates this HTML. */}
				<CodeBlock
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
							onPress={() => {
								startTransition(() => {
									addTransitionType(styles.codeTransitionType);
									dispatch({ type: 'toggle' });
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

type SourceMode = 'unmeasured' | 'fits' | 'collapsed' | 'expanded';

type SourceEvent = { isClipped: boolean; type: 'measured' } | { type: 'toggle' };

function sourceReducer(mode: SourceMode, event: SourceEvent): SourceMode {
	if (event.type === 'measured') {
		// Expanded source fits by definition. Keep its collapse control until it is toggled.
		if (mode === 'expanded') return mode;
		return event.isClipped ? 'collapsed' : 'fits';
	}

	switch (mode) {
		case 'collapsed':
			return 'expanded';
		case 'expanded':
			return 'collapsed';
		default:
			return mode;
	}
}

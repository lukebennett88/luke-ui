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
	const isExpandedInDomRef = useRef(false);

	useLayoutEffect(() => {
		isExpandedInDomRef.current = isExpanded;
	}, [isExpanded]);

	// Collapsing source that already fits does not resize it, so the observer stays quiet.
	useLayoutEffect(() => {
		const sourceElement = sourceRef.current;
		if (mode !== 'collapsed' || !sourceElement) return;
		dispatch({ isClipped: isSourceClipped(sourceElement), type: 'measured' });
	}, [mode]);

	useLayoutEffect(() => {
		const sourceElement = sourceRef.current;
		if (!sourceElement) return;

		const update = () => {
			// Expanded source says nothing about whether it fits when collapsed. A measurement taken
			// now could also be applied after a pending collapse, so skip it.
			if (isExpandedInDomRef.current) return;
			dispatch({ isClipped: isSourceClipped(sourceElement), type: 'measured' });
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

function isSourceClipped(sourceElement: HTMLElement) {
	return sourceElement.scrollHeight > sourceElement.clientHeight + 1;
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

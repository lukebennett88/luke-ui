import { Box } from '@luke-ui/react/box';
import { createIcon } from '@luke-ui/react/icon';
import { vars } from '@luke-ui/react/theme';
import type { ComponentProps, ReactNode } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import type { GroupImperativeHandle } from 'react-resizable-panels';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { StoryWrapper } from '../lib/story-wrapper.js';
import * as styles from './example-preview.css.js';
import { useIsDesktop } from './playground/use-is-desktop.js';

export function ExamplePreview({
	children,
	layout,
	title,
}: {
	children: ReactNode;
	layout?: ComponentProps<typeof StoryWrapper>['layout'];
	title: string;
}) {
	const isDesktop = useIsDesktop();
	const groupElement = useRef<HTMLDivElement>(null);
	const groupHandle = useRef<GroupImperativeHandle>(null);
	const [isCardWideEnough, setIsCardWideEnough] = useState(false);
	const previewId = useId();
	const outsideId = useId();
	const isResizable = isDesktop && isCardWideEnough;

	useEffect(() => {
		const element = groupElement.current;
		if (!element) return;
		const observer = new ResizeObserver(([entry]) => {
			if (!entry) return;
			setIsCardWideEnough(entry.contentRect.width >= styles.MIN_RESIZABLE_CARD_WIDTH);
		});
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		if (!isResizable)
			groupHandle.current?.setLayout({
				[previewId]: 100,
				[outsideId]: 0,
			});
	}, [isResizable, outsideId, previewId]);

	return (
		<Group
			className={styles.previewGroup}
			disabled={!isResizable}
			elementRef={groupElement}
			groupRef={groupHandle}
			orientation="horizontal"
			resizeTargetMinimumSize={EXAMPLE_RESIZE_TARGET_MINIMUM_SIZE}
		>
			<Panel
				defaultSize="100%"
				id={previewId}
				minSize={isResizable ? MIN_PREVIEW_WIDTH + RESIZE_GUTTER_WIDTH : 0}
			>
				{/* CSS sets the gutter before measurement. Examples query this canvas's width. */}
				<Box backgroundColor="surface.canvas" className={styles.previewCanvas} overflow="hidden">
					<StoryWrapper layout={layout}>{children}</StoryWrapper>
				</Box>
			</Panel>
			<Separator
				aria-label={`${title} preview`}
				className={styles.previewSeparator}
				disabled={!isResizable}
				onDoubleClick={() => {
					groupHandle.current?.setLayout({
						[previewId]: 100,
						[outsideId]: 0,
					});
				}}
			>
				<ExamplePreviewResizeGrip />
			</Separator>
			<Panel
				className={styles.previewOutside}
				defaultSize={0}
				id={outsideId}
				minSize={isResizable ? OUTSIDE_STRIP_WIDTH : 0}
			/>
		</Group>
	);
}

const MIN_PREVIEW_WIDTH = 320;
// Match sp24 and sp12 in example-preview.css.ts.
const RESIZE_GUTTER_WIDTH = 24;
const OUTSIDE_STRIP_WIDTH = 12;

const EXAMPLE_RESIZE_TARGET_MINIMUM_SIZE = { coarse: 32, fine: 32 };

const GripIcon = createIcon({
	path: (
		<>
			<path d="M8 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
			<path d="M8 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
			<path d="M8 19a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
			<path d="M14 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
			<path d="M14 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
			<path d="M14 19a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
		</>
	),
});

const GRIP_BLOCK_SIZE = '3.75rem';
const GRIP_INLINE_SIZE = '0.75rem';

function ExamplePreviewResizeGrip() {
	return (
		<Box
			alignItems="center"
			aria-hidden
			backgroundColor="surface.canvas"
			blockSize={GRIP_BLOCK_SIZE}
			borderRadius="full"
			borderStyle="solid"
			borderWidth="thin"
			className={styles.previewGripState}
			data-example-preview-grip
			display="flex"
			elementType="span"
			inlineSize={GRIP_INLINE_SIZE}
			insetBlockStart="50%"
			insetInlineStart="50%"
			justifyContent="center"
			overflow="hidden"
			position="absolute"
			style={{
				color: vars.color.text.secondary,
				pointerEvents: 'none',
				transform: 'translate(-50%, -50%)',
				transitionDuration: vars.motion.duration.enter,
				transitionProperty: 'box-shadow, border-color',
				transitionTimingFunction: vars.motion.easing.standard,
			}}
		>
			<GripIcon style={{ blockSize: '100%', inlineSize: '100%' }} />
		</Box>
	);
}

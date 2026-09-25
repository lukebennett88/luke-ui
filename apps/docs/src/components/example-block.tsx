import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import type { IconName } from '@luke-ui/react/icon';
import { createIcon, Icon } from '@luke-ui/react/icon';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { ScrollFade } from '@luke-ui/react/scroll-fade';
import { Text } from '@luke-ui/react/text';
import { deriveNestedRadius, vars } from '@luke-ui/react/theme';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import type { ComponentType, JSX, ReactNode } from 'react';
import { Suspense, use, useEffect, useId, useRef, useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import type { GroupImperativeHandle } from 'react-resizable-panels';
import type { HighlightedSource } from '../lib/highlighted-source.js';
import { StoryWrapper } from '../lib/story-wrapper.js';
import { DocsLink } from './docs-link.js';
import { useIsDesktop } from './playground/use-is-desktop.js';

// The frame, header, preview, and code block nest one border's gap inside
// `OUTER_RADIUS`, so their corners stay concentric with the frame's own.
const OUTER_RADIUS = vars.radius.control;
const INNER_RADIUS = deriveNestedRadius(OUTER_RADIUS, '1px');

type ExampleBlockProps = {
	src: string;
	title: string;
	layout?: 'flow' | 'centered' | 'full-bleed';
};

export function ExampleBlock(props: ExampleBlockProps): JSX.Element {
	return (
		<Suspense fallback={<ExampleLoadingState layout={props.layout} title={props.title} />}>
			<ExampleContent {...props} />
		</Suspense>
	);
}

function ExampleContent({ layout, src, title }: ExampleBlockProps): JSX.Element {
	const slashIndex = src.indexOf('/');
	const component = src.slice(0, slashIndex);
	const name = src.slice(slashIndex + 1);
	const result = use(loadExample(component, name));
	const [showCode, setShowCode] = useState(false);
	const codeId = useId();

	if (!result.ok) {
		return (
			<Box className="rounded-lg border border-fd-destructive p-4 text-fd-destructive">
				Failed to load example {component}/{name}: {result.error.message}
			</Box>
		);
	}

	const [PreviewComponent, highlightedSource] = result.data;

	return (
		<ExampleFrame
			actions={
				<Box alignItems="center" display="flex" flexShrink="0" gap="sp4">
					{highlightedSource.playgroundHash != null ? (
						<OpenInPlayground hash={highlightedSource.playgroundHash} />
					) : null}
					<ShowCode
						codeId={codeId}
						isExpanded={showCode}
						onPress={() => setShowCode((prev) => !prev)}
					/>
				</Box>
			}
			title={title}
		>
			<ExamplePreview layout={layout} title={title}>
				<PreviewComponent />
			</ExamplePreview>
			{showCode ? (
				<Box
					id={codeId}
					overflow="hidden"
					style={{
						borderEndEndRadius: INNER_RADIUS,
						borderEndStartRadius: INNER_RADIUS,
					}}
				>
					<CodeBlock className="my-0 rounded-none border-x-0 border-b-0 shadow-none">
						{/* Shiki escapes the source before the Vite plugin generates this HTML. */}
						<Pre dangerouslySetInnerHTML={{ __html: highlightedSource.html }} />
					</CodeBlock>
				</Box>
			) : null}
		</ExampleFrame>
	);
}

export function ExampleLoadingState({
	layout,
	title,
}: Pick<ExampleBlockProps, 'layout' | 'title'>) {
	const loadingLabel = `Loading ${title} example`;
	const isFullBleed = layout === 'full-bleed';

	return (
		<ExampleFrame actions={<ExampleLoadingActions />} ariaLabel={loadingLabel} title={title}>
			<StoryWrapper layout={layout}>
				<Box
					alignItems="center"
					display="flex"
					justifyContent="center"
					minBlockSize={isFullBleed ? '6rem' : undefined}
				>
					<LoadingSpinner aria-label={loadingLabel} />
				</Box>
			</StoryWrapper>
		</ExampleFrame>
	);
}

// Keep in sync with Tailwind on ExamplePreview: md (768px, DESKTOP_MEDIA_QUERY),
// @[640px]/example-preview-card (MIN_RESIZABLE_CARD_WIDTH), pe-6 (RESIZE_GUTTER_WIDTH),
// Group [&>[data-panel]:last-child]:!min-w-3 (OUTSIDE_STRIP_WIDTH).
const MIN_RESIZABLE_CARD_WIDTH = 640;
const MIN_PREVIEW_WIDTH = 320;
const RESIZE_GUTTER_WIDTH = 24;
/** Matches grip half-width so the handle stays fully inside the card at full preview. */
const OUTSIDE_STRIP_WIDTH = 12;

// Larger than playground's shared `RESIZE_TARGET_MINIMUM_SIZE` so the
// example-card grip is easier to hit; keep playground's constant unchanged.
const EXAMPLE_RESIZE_TARGET_MINIMUM_SIZE = { coarse: 32, fine: 32 };

export function ExamplePreview({
	children,
	layout,
	title,
}: {
	children: ReactNode;
	layout?: ExampleBlockProps['layout'];
	title: string;
}) {
	const isDesktop = useIsDesktop();
	const groupElement = useRef<HTMLDivElement>(null);
	const groupHandle = useRef<GroupImperativeHandle>(null);
	const [cardWidth, setCardWidth] = useState(0);
	const previewId = useId();
	const outsideId = useId();
	const isResizable = isDesktop && cardWidth >= MIN_RESIZABLE_CARD_WIDTH;

	useEffect(() => {
		const element = groupElement.current;
		if (!element) return;
		const observer = new ResizeObserver(() => setCardWidth(element.getBoundingClientRect().width));
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		if (!isResizable) groupHandle.current?.setLayout({ [previewId]: 100, [outsideId]: 0 });
	}, [isResizable, outsideId, previewId]);

	return (
		<Group
			className="@container/example-preview-card isolate flex overflow-hidden md:@[640px]/example-preview-card:[&>[data-panel]:last-child]:min-w-3!"
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
				{/*
					Named card container is on the Group; this unnamed
					inline-size container is the nearest for responsive
					examples. Gutter (md:@[640px]/example-preview-card:pe-6)
					and separator visibility (hidden md:@[640px]/…:block) are
					Tailwind so first paint already matches final width.
					Outside strip: Group targets last [data-panel] with !min-w-3
					(Panel className is nested; library sets inline minWidth:0).
				*/}
				<div
					className="example-preview-canvas @container overflow-hidden md:@[640px]/example-preview-card:pe-6"
					style={{ backgroundColor: vars.color.surface.canvas }}
				>
					<StoryWrapper layout={layout}>{children}</StoryWrapper>
				</div>
			</Panel>
			<Separator
				aria-label={`${title} preview`}
				className="example-preview-separator hidden md:@[640px]/example-preview-card:block relative z-10 shrink-0 inline-px cursor-col-resize bg-fd-border data-[separator=active]:[&>.example-preview-grip]:border-fd-muted-foreground data-[separator=focus]:[&>.example-preview-grip]:ring-2 data-[separator=focus]:[&>.example-preview-grip]:ring-fd-ring data-[separator=hover]:[&>.example-preview-grip]:border-fd-muted-foreground/80"
				disabled={!isResizable}
				onDoubleClick={() => {
					groupHandle.current?.setLayout({ [previewId]: 100, [outsideId]: 0 });
				}}
			>
				<ExamplePreviewResizeGrip />
			</Separator>
			<Panel
				className="bg-fd-muted/50"
				defaultSize={0}
				id={outsideId}
				minSize={isResizable ? OUTSIDE_STRIP_WIDTH : 0}
			/>
		</Group>
	);
}

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

function ExamplePreviewResizeGrip() {
	return (
		<span
			aria-hidden
			className="example-preview-grip pointer-events-none absolute top-1/2 left-1/2 flex h-15 w-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border border-fd-border bg-fd-card text-fd-muted-foreground shadow-sm transition-[box-shadow,border-color]"
		>
			<GripIcon className="size-full" />
		</span>
	);
}

function OpenInPlayground({ hash }: { hash: string }) {
	return (
		<DocsLink
			appearance="button"
			hash={hash}
			prominence="low"
			size="small"
			startContent={<Icon name="externalLink" />}
			target="_blank"
			to="/playground"
		>
			Open in playground
		</DocsLink>
	);
}

function ShowCode({
	codeId,
	isExpanded,
	onPress,
}: {
	codeId: string;
	isExpanded: boolean;
	onPress: () => void;
}) {
	return (
		<Button
			aria-controls={codeId}
			aria-expanded={isExpanded}
			onPress={onPress}
			prominence="low"
			size="small"
			startContent={<Icon name="codeBlock" />}
		>
			{isExpanded ? 'Hide code' : 'Show code'}
		</Button>
	);
}

// Mirrors `OpenInPlayground` and `ShowCode`'s visuals without mounting a
// router link or wiring up real interaction — this is an `aria-hidden`,
// `inert` placeholder, so a plain disabled `Button` is enough for both.
function ActionPlaceholder({ children, iconName }: { children: ReactNode; iconName: IconName }) {
	return (
		<Button isDisabled prominence="low" size="small" startContent={<Icon name={iconName} />}>
			{children}
		</Button>
	);
}

function ExampleLoadingActions() {
	return (
		<Box aria-hidden alignItems="center" display="flex" flexShrink="0" gap="sp4" inert>
			<LoadingSkeleton radius="control">
				<ActionPlaceholder iconName="externalLink">Open in playground</ActionPlaceholder>
			</LoadingSkeleton>
			<LoadingSkeleton radius="control">
				<ActionPlaceholder iconName="codeBlock">Show code</ActionPlaceholder>
			</LoadingSkeleton>
		</Box>
	);
}

type ExampleFrameProps = {
	actions?: ReactNode;
	ariaLabel?: string;
	children: ReactNode;
	title: string;
};

function ExampleFrame({ actions, ariaLabel, children, title }: ExampleFrameProps) {
	const titleId = useId();
	return (
		<Box
			aria-label={ariaLabel}
			className="not-prose isolate border border-fd-border"
			marginBlock="sp16"
			role={ariaLabel ? 'region' : undefined}
			style={{ borderRadius: OUTER_RADIUS }}
		>
			<ScrollFade
				aria-labelledby={titleId}
				className="border-b border-fd-border bg-fd-card"
				style={{
					borderStartEndRadius: INNER_RADIUS,
					borderStartStartRadius: INNER_RADIUS,
				}}
			>
				<Box
					alignItems="center"
					display="flex"
					gap="sp8"
					inlineSize="max-content"
					justifyContent="space-between"
					minInlineSize="100%"
					paddingBlock="sp8"
					paddingInline="sp16"
				>
					<Text
						color="secondary"
						elementType="span"
						id={titleId}
						style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
						typography="label"
					>
						{title}
					</Text>
					{actions}
				</Box>
			</ScrollFade>
			<Box
				overflow="hidden"
				style={{
					borderEndEndRadius: INNER_RADIUS,
					borderEndStartRadius: INNER_RADIUS,
				}}
			>
				{children}
			</Box>
		</Box>
	);
}

const _modules = import.meta.glob<ComponentType>('../examples/*/*.tsx', {
	eager: false,
	import: 'default',
});

const _highlightedSources = import.meta.glob<HighlightedSource>('../examples/*/*.tsx', {
	eager: false,
	import: 'default',
	query: '?highlight',
});

type ExampleLoader = [() => Promise<ComponentType>, () => Promise<HighlightedSource>];

type ExampleTuple = [ComponentType, HighlightedSource];

type ExampleResult =
	| {
			ok: true;
			data: ExampleTuple;
	  }
	| {
			ok: false;
			error: Error;
	  };

const exampleCache = new Map<string, Promise<ExampleResult>>();

function findExample(component: string, name: string): ExampleLoader | null {
	const key = `../examples/${component}/${name}.tsx`;
	const loadModule = _modules[key];
	const loadHighlightedSource = _highlightedSources[key];

	if (!loadModule || !loadHighlightedSource) return null;

	return [loadModule, loadHighlightedSource];
}

function loadExample(component: string, name: string): Promise<ExampleResult> {
	const key = `${component}/${name}`;
	const cached = exampleCache.get(key);
	if (cached) return cached;

	const match = findExample(component, name);
	if (!match) {
		const promise = Promise.resolve({
			error: new Error(`Example not found: ${key}`),
			ok: false,
		} satisfies ExampleResult);
		exampleCache.set(key, promise);
		return promise;
	}

	const [loadModule, loadHighlightedSource] = match;
	const promise = Promise.all([loadModule(), loadHighlightedSource()])
		.then(([loadedComponent, loadedSource]): ExampleResult => ({
			data: [loadedComponent, loadedSource],
			ok: true,
		}))
		.catch((err): ExampleResult => ({
			error: err instanceof Error ? err : new Error(String(err)),
			ok: false,
		}));

	exampleCache.set(key, promise);
	return promise;
}

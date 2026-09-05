import { Box } from '@luke-ui/react/box';
import { Button, buttonRecipe } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { deriveNestedRadius, vars } from '@luke-ui/react/theme';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import type { ComponentType, JSX, ReactNode } from 'react';
import { Suspense, use, useId, useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
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
	mode?: 'inset' | 'full-bleed';
};

export function ExampleBlock(props: ExampleBlockProps): JSX.Element {
	return (
		<Suspense fallback={<ExampleLoadingState mode={props.mode} title={props.title} />}>
			<ExampleContent {...props} />
		</Suspense>
	);
}

function ExampleContent({ mode, src, title }: ExampleBlockProps): JSX.Element {
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
				<Box className="flex items-center gap-1">
					{highlightedSource.playgroundHash != null ? (
						<DocsLink
							{...buttonRecipe({ appearance: 'ghost', size: 'small' })}
							hash={highlightedSource.playgroundHash}
							target="_blank"
							to="/playground"
						>
							<Icon aria-hidden className="size-4" name="externalLink" />
							Open in playground
						</DocsLink>
					) : null}
					<Button
						appearance="ghost"
						aria-controls={codeId}
						aria-expanded={showCode}
						onPress={() => setShowCode((previous) => !previous)}
						size="small"
					>
						<Icon aria-hidden className="size-4" name="codeBlock" />
						{showCode ? 'Hide code' : 'Show code'}
					</Button>
				</Box>
			}
			title={title}
		>
			<ExamplePreview isCodeShown={showCode} mode={mode} title={title}>
				<PreviewComponent />
			</ExamplePreview>
			{showCode ? (
				<Box
					className="overflow-hidden"
					id={codeId}
					style={{ borderEndEndRadius: INNER_RADIUS, borderEndStartRadius: INNER_RADIUS }}
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

export function ExampleLoadingState({ mode, title }: Pick<ExampleBlockProps, 'mode' | 'title'>) {
	const loadingLabel = `Loading ${title} example`;
	const isFullBleed = mode === 'full-bleed';

	return (
		<ExampleFrame actions={<ExampleLoadingActions />} ariaLabel={loadingLabel} title={title}>
			<StoryWrapper mode={mode}>
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

const EXAMPLE_RESIZE_TARGET_MINIMUM_SIZE = { coarse: 32, fine: 32 };

export function ExamplePreview({
	children,
	isCodeShown,
	mode,
	title,
}: {
	children: ReactNode;
	isCodeShown: boolean;
	mode?: ExampleBlockProps['mode'];
	title: string;
}) {
	const isDesktop = useIsDesktop();

	return (
		<Group
			// Isolate so the separator's z-index cannot paint over the sticky page header.
			className="isolate flex"
			orientation="horizontal"
			resizeTargetMinimumSize={EXAMPLE_RESIZE_TARGET_MINIMUM_SIZE}
			style={{ overflow: 'visible' }}
		>
			<Panel defaultSize="100%" minSize={isDesktop ? 320 : 0}>
				{/*
					The panel establishes its own inline-size container so a
					responsive example narrows against the preview width, not
					the document root — the theme stylesheet's container
					queries otherwise only ever see the full viewport. Rounding
					and clipping live here, not on the frame, so the separator's
					grip can sit outside this panel's edge and still be clickable.
				*/}
				<div
					className="overflow-hidden"
					style={{
						borderEndEndRadius: isCodeShown ? undefined : INNER_RADIUS,
						borderEndStartRadius: isCodeShown ? undefined : INNER_RADIUS,
						containerType: 'inline-size',
					}}
				>
					<StoryWrapper mode={mode}>{children}</StoryWrapper>
				</div>
			</Panel>
			<Separator
				aria-label={`${title} preview`}
				className="relative z-10 hidden shrink-0 inline-px after:absolute after:block-16 after:inline-1.5 after:rounded-full after:bg-fd-muted-foreground/50 after:transition-colors after:-translate-y-1/2 after:inset-bs-[50%] after:inset-s-[calc(100%+0.5rem)] after:content-[''] data-[separator=active]:after:bg-fd-muted-foreground/80 data-[separator=focus]:after:bg-fd-muted-foreground/80 data-[separator=hover]:after:bg-fd-muted-foreground/65 md:block"
			/>
			<Panel defaultSize={0} minSize={0} />
		</Group>
	);
}

function ExampleLoadingActions() {
	return (
		<Box aria-hidden className="flex items-center gap-1" inert>
			<LoadingSkeleton radius="control">
				<span {...buttonRecipe({ appearance: 'ghost', size: 'small' })}>
					<Icon aria-hidden className="size-4" name="externalLink" />
					Open in playground
				</span>
			</LoadingSkeleton>
			<LoadingSkeleton radius="control">
				<Button appearance="ghost" isDisabled size="small">
					<Icon aria-hidden className="size-4" name="codeBlock" />
					Show code
				</Button>
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
	return (
		<Box
			aria-label={ariaLabel}
			// `overflow-visible` lets the resize grip sit outside the frame.
			// `isolate` keeps that grip's stacking inside this card so it
			// cannot paint over the sticky page header.
			className="not-prose isolate my-4 overflow-visible border border-fd-border"
			role={ariaLabel ? 'region' : undefined}
			style={{ borderRadius: OUTER_RADIUS }}
		>
			<Box
				className="flex items-center justify-between gap-2 overflow-hidden border-fd-border border-b bg-fd-card px-4 py-2"
				style={{ borderStartEndRadius: INNER_RADIUS, borderStartStartRadius: INNER_RADIUS }}
			>
				<span className="text-fd-muted-foreground text-sm">{title}</span>
				{actions}
			</Box>
			{children}
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

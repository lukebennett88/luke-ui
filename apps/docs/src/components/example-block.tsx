import { Box } from '@luke-ui/react/box';
import { Button, buttonRecipe } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import type { JSX, ReactNode } from 'react';
import { Suspense, use, useEffect, useId, useRef, useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { withBasePath } from '../lib/base-path.js';
import { createExamplePreviewPageSession } from '../lib/example-preview-handshake.js';
import { EXAMPLE_PREVIEW_MINIMUM_HEIGHT } from '../lib/example-preview-protocol.js';
import type { ExamplePreviewAppearanceMessage } from '../lib/example-preview-protocol.js';
import type { HighlightedSource } from '../lib/highlighted-source.js';
import { StoryWrapper } from '../lib/story-wrapper.js';
import { DocsLink } from './docs-link.js';
import { useHydratedColorModeSelection } from './playground/color-mode-toggle.js';
import { useIsDesktop } from './playground/use-is-desktop.js';
import { useDocsThemeIdentity } from './theme-controls.js';

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

	const highlightedSource = result.data;

	return (
		<ExampleFrame
			actions={
				<Box className="flex items-center gap-1">
					{highlightedSource.playgroundHash != null ? (
						<DocsLink
							className={buttonRecipe({ appearance: 'ghost', size: 'small' })}
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
			<ExamplePreview isCodeShown={showCode} mode={mode} src={src} />
			{showCode ? (
				<Box className="overflow-hidden rounded-b-[7px]" id={codeId}>
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
	isCodeShown,
	mode,
	src,
}: {
	isCodeShown: boolean;
	mode?: ExampleBlockProps['mode'];
	src: string;
}) {
	const isDesktop = useIsDesktop();
	const preview = <ExampleIframe isCodeShown={isCodeShown} key={src} mode={mode} src={src} />;

	return (
		<Group
			className="flex"
			orientation="horizontal"
			resizeTargetMinimumSize={EXAMPLE_RESIZE_TARGET_MINIMUM_SIZE}
			style={{ overflow: 'visible' }}
		>
			<Panel defaultSize="100%" minSize={isDesktop ? 320 : 0}>
				{preview}
			</Panel>
			<Separator
				aria-label="Resize example preview"
				className="relative z-10 hidden shrink-0 inline-px after:absolute after:block-16 after:inline-1.5 after:rounded-full after:bg-fd-muted-foreground/50 after:transition-colors after:-translate-y-1/2 after:inset-bs-[50%] after:inset-s-[calc(100%+0.5rem)] after:content-[''] data-[separator=active]:after:bg-fd-muted-foreground/80 data-[separator=focus]:after:bg-fd-muted-foreground/80 data-[separator=hover]:after:bg-fd-muted-foreground/65 md:block"
			/>
			<Panel defaultSize={0} minSize={0} />
		</Group>
	);
}

function ExampleIframe({
	isCodeShown,
	mode,
	src,
}: Pick<ExampleBlockProps, 'mode' | 'src'> & { isCodeShown: boolean }) {
	const colorMode = useHydratedColorModeSelection();
	const { themeIdentity } = useDocsThemeIdentity();
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const sessionRef = useRef(createExamplePreviewPageSession());
	const appearanceRef = useRef<Omit<ExamplePreviewAppearanceMessage, 'type'> | null>(null);
	const [height, setHeight] = useState(EXAMPLE_PREVIEW_MINIMUM_HEIGHT);
	const [error, setError] = useState<string | null>(null);
	const search = new URLSearchParams({ mode: mode ?? 'inset', src });
	const previewUrl = withBasePath('/examples/preview', import.meta.env.BASE_URL);
	const ports = () => ({
		origin: window.location.origin,
		previewWindow: iframeRef.current?.contentWindow ?? null,
	});

	useEffect(() => {
		const session = sessionRef.current;
		const onMessage = (event: MessageEvent) => {
			session.handlePreviewMessage(event, ports(), {
				appearance: appearanceRef.current,
				onError: setError,
				onHeight: (nextHeight) => {
					setHeight((previousHeight) =>
						previousHeight === nextHeight ? previousHeight : nextHeight,
					);
				},
			});
		};

		window.addEventListener('message', onMessage);
		session.requestHeight(ports());
		return () => window.removeEventListener('message', onMessage);
	}, []);

	useEffect(() => {
		const appearance = colorMode === null ? null : { colorMode, themeIdentity };
		appearanceRef.current = appearance;
		if (appearance !== null) sessionRef.current.postAppearance(appearance, ports());
	}, [colorMode, themeIdentity]);

	return (
		<div
			className={`relative overflow-hidden bg-fd-muted${isCodeShown ? '' : ' rounded-b-[7px]'}`}
			data-example-preview-canvas
			style={{ height }}
		>
			<iframe
				ref={iframeRef}
				className="block size-full border-0 [[data-group]:has([data-separator=active])_&]:pointer-events-none [[data-group]:has([data-separator=hover])_&]:pointer-events-none"
				loading="lazy"
				onLoad={() => sessionRef.current.requestHeight(ports())}
				src={`${previewUrl}?${search}`}
				style={{ minBlockSize: 'max(20rem, 100dvh)' }}
				title={`Preview of ${src}`}
			/>
			{error === null ? null : (
				<div
					className="absolute inset-0 z-20 flex items-center justify-center bg-fd-card p-4 text-center text-fd-destructive text-sm"
					role="alert"
				>
					Failed to render example: {error}
				</div>
			)}
		</div>
	);
}

function ExampleLoadingActions() {
	return (
		<Box aria-hidden className="flex items-center gap-1" inert>
			<LoadingSkeleton radius="control">
				<span className={buttonRecipe({ appearance: 'ghost', size: 'small' })}>
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
			className="not-prose my-4 overflow-visible rounded-lg border border-fd-border"
			role={ariaLabel ? 'region' : undefined}
		>
			<Box className="flex items-center justify-between gap-2 overflow-hidden rounded-t-[7px] border-fd-border border-b bg-fd-card px-4 py-2">
				<span className="text-fd-muted-foreground text-sm">{title}</span>
				{actions}
			</Box>
			{children}
		</Box>
	);
}

const _highlightedSources = import.meta.glob<HighlightedSource>('../examples/*/*.tsx', {
	eager: false,
	import: 'default',
	query: '?highlight',
});

type ExampleResult =
	| {
			ok: true;
			data: HighlightedSource;
	  }
	| {
			ok: false;
			error: Error;
	  };

const exampleCache = new Map<string, Promise<ExampleResult>>();

function findExample(component: string, name: string): (() => Promise<HighlightedSource>) | null {
	const key = `../examples/${component}/${name}.tsx`;
	const loadHighlightedSource = _highlightedSources[key];

	if (!loadHighlightedSource) return null;

	return loadHighlightedSource;
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

	const promise = match()
		.then((loadedSource): ExampleResult => ({
			data: loadedSource,
			ok: true,
		}))
		.catch((err): ExampleResult => ({
			error: err instanceof Error ? err : new Error(String(err)),
			ok: false,
		}));

	exampleCache.set(key, promise);
	return promise;
}

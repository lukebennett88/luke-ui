import { Box } from '@luke-ui/react/box';
import { Button, buttonRecipe } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import type { ComponentType, JSX, ReactNode } from 'react';
import { Suspense, use, useId, useState } from 'react';
import type { HighlightedSource } from '../lib/highlighted-source.js';
import { StoryWrapper } from '../lib/story-wrapper.js';
import { DocsLink } from './docs-link.js';

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
			<StoryWrapper mode={mode}>
				<PreviewComponent />
			</StoryWrapper>
			{showCode ? (
				<Box id={codeId}>
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
			className="not-prose my-4 overflow-hidden rounded-lg border border-fd-border"
			role={ariaLabel ? 'region' : undefined}
		>
			<Box className="flex items-center justify-between gap-2 border-fd-border border-b bg-fd-card px-4 py-2">
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
		.then(
			([loadedComponent, loadedSource]): ExampleResult => ({
				data: [loadedComponent, loadedSource],
				ok: true,
			}),
		)
		.catch(
			(err): ExampleResult => ({
				error: err instanceof Error ? err : new Error(String(err)),
				ok: false,
			}),
		);

	exampleCache.set(key, promise);
	return promise;
}

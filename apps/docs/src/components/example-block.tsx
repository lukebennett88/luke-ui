import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { Text } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import type { ComponentProps, ComponentType, JSX, ReactNode } from 'react';
import { Suspense, use } from 'react';
import type { HighlightedSource } from '../lib/highlighted-source.js';
import { StoryWrapper } from '../lib/story-wrapper.js';
import { DocsLink } from './docs-link.js';
import { ExampleCodePreview } from './example-code-preview.js';
import { ExamplePreview } from './example-preview.js';

/** Concentric with the frame's `borderRadius="control"` after the 1px border. */
const INNER_RADIUS = `max(0px, calc(${vars.radius.control} - 1px))`;

const frameEndRadiusStyle = {
	borderEndEndRadius: INNER_RADIUS,
	borderEndStartRadius: INNER_RADIUS,
} as const;

type ExampleBlockProps = {
	src: string;
	title: string;
	layout?: ComponentProps<typeof StoryWrapper>['layout'];
};

export function ExampleBlock(props: ExampleBlockProps): JSX.Element {
	return (
		<Suspense fallback={<ExampleLoadingState layout={props.layout} title={props.title} />}>
			<ExampleContent {...props} />
		</Suspense>
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

function ExampleContent({ layout, src, title }: ExampleBlockProps): JSX.Element {
	const slashIndex = src.indexOf('/');
	const component = src.slice(0, slashIndex);
	const name = src.slice(slashIndex + 1);
	const result = use(loadExample(component, name));

	if (!result.ok) {
		return (
			<Box
				borderColor="danger"
				borderRadius="control"
				borderStyle="solid"
				borderWidth="thin"
				padding="sp16"
			>
				<Text color="danger" elementType="p">
					Failed to load example {component}/{name}: {result.error.message}
				</Text>
			</Box>
		);
	}

	const [PreviewComponent, highlightedSource] = result.data;

	return (
		<ExampleFrame
			actions={
				highlightedSource.playgroundHash != null ? (
					<OpenInPlayground hash={highlightedSource.playgroundHash} />
				) : null
			}
			title={title}
		>
			<ExamplePreview layout={layout} title={title}>
				<PreviewComponent />
			</ExamplePreview>
			{/* Remount when the source changes so expand state resets without an effect. */}
			<ExampleCodePreview
				html={highlightedSource.html}
				key={highlightedSource.source}
				source={highlightedSource.source}
				title={title}
			/>
		</ExampleFrame>
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
			borderColor="decorative"
			borderRadius="control"
			borderStyle="solid"
			borderWidth="thin"
			className="not-prose"
			data-example-frame
			marginBlock="sp16"
			role={ariaLabel ? 'region' : undefined}
			style={{ isolation: 'isolate' }}
		>
			<Box
				alignItems="center"
				backgroundColor="surface.canvas"
				display="flex"
				gap="sp8"
				justifyContent="space-between"
				paddingBlock="sp8"
				paddingInline="sp16"
				style={{
					borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
					borderStartEndRadius: INNER_RADIUS,
					borderStartStartRadius: INNER_RADIUS,
				}}
			>
				<Box flex="1 1 auto" minInlineSize={0}>
					<Text color="secondary" elementType="div" typography="label">
						{title}
					</Text>
				</Box>
				{actions != null ? (
					<Box alignItems="center" display="flex" flexShrink="0" gap="sp4">
						{actions}
					</Box>
				) : null}
			</Box>
			<Box overflow="hidden" style={frameEndRadiusStyle}>
				{children}
			</Box>
		</Box>
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

function ExampleLoadingActions() {
	return (
		<Box alignItems="center" aria-hidden display="flex" flexShrink="0" gap="sp4" inert>
			<LoadingSkeleton radius="control">
				<Button
					isDisabled
					prominence="low"
					size="small"
					startContent={<Icon name="externalLink" />}
				>
					Open in playground
				</Button>
			</LoadingSkeleton>
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

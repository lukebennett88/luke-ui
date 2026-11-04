import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { Text } from '@luke-ui/react/text';
import { cx } from '@luke-ui/react/utils';
import type { ComponentProps, ComponentType, JSX, ReactNode } from 'react';
import { lazy, Suspense, use, useId, useRef, useState } from 'react';
import { encodeDocsPlaygroundHash } from '../lib/docs-playground-hash.js';
import type { HighlightedSource } from '../lib/highlighted-source.js';
import { StoryWrapper } from '../lib/story-wrapper.js';
import { DocsLink } from './docs-link.js';
import * as styles from './example-block.css.js';
import { ExampleCodePreview } from './example-code-preview.js';
import { ExamplePreview } from './example-preview.js';

const PlaygroundEditor = lazy(() => import('./playground/editor.js'));
const InlineExamplePreview = lazy(() => import('./inline-example-preview.js'));

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

function ExampleLoadingState({ layout, title }: Pick<ExampleBlockProps, 'layout' | 'title'>) {
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
				borderColor="danger.strong"
				borderRadius="control"
				borderStyle="solid"
				borderWidth="thin"
				padding="space.16"
			>
				<Text color="danger" elementType="p">
					Failed to load example {component}/{name}: {result.error.message}
				</Text>
			</Box>
		);
	}

	const [PreviewComponent, highlightedSource] = result.data;
	if (src === 'checkbox-field/controlled') {
		return (
			<InlineExamplePrototype
				PreviewComponent={PreviewComponent}
				highlightedSource={highlightedSource}
				layout={layout}
				title={title}
			/>
		);
	}

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


/**
 * Single-example experiment for #705. Keep this out of the shared ExampleBlock contract until
 * the editor's loading, usability, and accessibility justify a production feature.
 */
function InlineExamplePrototype({
	PreviewComponent,
	highlightedSource,
	layout,
	title,
}: {
	PreviewComponent: ComponentType;
	highlightedSource: HighlightedSource;
	layout: ExampleBlockProps['layout'];
	title: string;
}) {
	const originalSource = highlightedSource.source;
	const [code, setCode] = useState(originalSource);
	const [isEditing, setIsEditing] = useState(false);
	const [hasActivated, setHasActivated] = useState(false);
	const [html, setHtml] = useState<string | undefined>(highlightedSource.html);
	const highlightRequest = useRef(0);
	const isModified = code !== originalSource;
	const playgroundHash = isModified
		? encodeDocsPlaygroundHash(code)
		: highlightedSource.playgroundHash;

	const startEditing = () => {
		highlightRequest.current += 1;
		setHasActivated(true);
		setIsEditing(true);
	};

	const finishEditing = async () => {
		setIsEditing(false);
		if (!isModified) {
			setHtml(highlightedSource.html);
			return;
		}

		const request = ++highlightRequest.current;
		setHtml(undefined);
		try {
			const { highlightEditedSource } = await import('../lib/highlight-edited-source.js');
			const highlighted = await highlightEditedSource(code);
			if (request === highlightRequest.current) setHtml(highlighted);
		} catch {
			// Plain code stays accessible and copyable if highlighting is unavailable.
		}
	};

	const reset = () => {
		highlightRequest.current += 1;
		setCode(originalSource);
		setHtml(highlightedSource.html);
		setIsEditing(false);
		setHasActivated(false);
	};

	return (
		<ExampleFrame
			actions={playgroundHash == null ? null : <OpenInPlayground hash={playgroundHash} />}
			title={title}
		>
			<ExamplePreview layout={hasActivated ? 'full-bleed' : layout} title={title}>
				{hasActivated ? (
					<Suspense fallback={<LoadingSpinner aria-label="Loading editable preview" />}>
						<InlineExamplePreview code={code} title={title} />
					</Suspense>
				) : (
					<PreviewComponent />
				)}
			</ExamplePreview>
			{isEditing ? (
				<Box blockSize="20rem" minBlockSize="20rem" overflow="hidden">
					<Suspense fallback={<LoadingSpinner aria-label="Loading code editor" />}>
						<PlaygroundEditor
							defaultValue={code}
							onChange={setCode}
							showLoadingPill={false}
						/>
					</Suspense>
				</Box>
			) : (
				<ExampleCodePreview html={html} key={code} source={code} title={title} />
			)}
			<Box
				alignItems="center"
				backgroundColor="surface.subdued"
				display="flex"
				gap="space.8"
				paddingBlock="space.8"
				paddingInline="space.16"
			>
				<Button
					onPress={isEditing ? () => void finishEditing() : startEditing}
					size="small"
				>
					{isEditing ? 'Done editing' : 'Edit code'}
				</Button>
				{hasActivated ? (
					<Button onPress={reset} prominence="low" size="small">
						Reset
					</Button>
				) : null}
			</Box>
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
	const titleId = useId();

	return (
		<Box
			aria-label={ariaLabel}
			aria-labelledby={ariaLabel ? undefined : titleId}
			borderColor="decorative"
			borderRadius="control"
			borderStyle="solid"
			borderWidth="thin"
			className={cx(styles.frame, 'not-prose')}
			data-example-frame
			marginBlock="space.16"
			role={ariaLabel ? 'region' : 'group'}
		>
			<Box
				alignItems="center"
				backgroundColor="surface.base"
				className={styles.frameHeader}
				display="flex"
				gap="space.8"
				justifyContent="space-between"
				paddingBlock="space.8"
				paddingInline="space.16"
			>
				<Box flex="1 1 auto" minInlineSize={0}>
					<Text color="secondary" elementType="div" id={titleId} typography="label">
						{title}
					</Text>
				</Box>
				{actions != null ? (
					<Box alignItems="center" display="flex" flexShrink="0" gap="space.4">
						{actions}
					</Box>
				) : null}
			</Box>
			<Box className={styles.frameBody} overflow="hidden">
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
		<Box alignItems="center" aria-hidden display="flex" flexShrink="0" gap="space.4" inert>
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

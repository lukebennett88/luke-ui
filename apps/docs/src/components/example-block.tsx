import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { Link } from '@tanstack/react-router';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import type { ComponentType, JSX } from 'react';
import { Suspense, use, useId, useState } from 'react';
import { encodeCodeHash } from '../lib/playground-hash';
import { StoryWrapper } from '../lib/story-wrapper';

type ExampleBlockProps = {
	src: string;
	description: string;
	title: string;
	mode?: 'inset' | 'full-bleed';
};

export function ExampleBlock(props: ExampleBlockProps): JSX.Element {
	return (
		<Suspense
			fallback={<Box className="rounded-lg border border-fd-border p-4">Loading example…</Box>}
		>
			<ExampleContent {...props} />
		</Suspense>
	);
}

const _modules = import.meta.glob<ComponentType>('../examples/*/*.tsx', {
	eager: false,
	import: 'default',
});

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

	const [PreviewComponent, source] = result.data;

	return (
		<Box className="not-prose overflow-hidden rounded-lg border border-fd-border">
			<Box className="flex items-center justify-between gap-2 border-fd-border border-b bg-fd-card px-4 py-2">
				<span className="text-fd-muted-foreground text-sm">{title}</span>
				<Box className="flex items-center gap-1">
					<Link
						className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
						hash={encodeCodeHash(source.trim())}
						target="_blank"
						to="/playground"
					>
						<Icon aria-hidden className="size-4" name="externalLink" />
						Open in playground
					</Link>
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
			</Box>
			<StoryWrapper mode={mode}>
				<PreviewComponent />
			</StoryWrapper>
			{showCode ? (
				<Box id={codeId}>
					<DynamicCodeBlock
						code={source.trim()}
						codeblock={{ className: 'my-0 rounded-none border-x-0 border-b-0 shadow-none' }}
						lang="tsx"
					/>
				</Box>
			) : null}
		</Box>
	);
}

const _sources = import.meta.glob<string>('../examples/*/*.tsx', {
	eager: false,
	import: 'default',
	query: '?raw',
});

type ExampleTuple = [ComponentType, string];

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

function findExample(
	component: string,
	name: string,
): [() => Promise<ComponentType>, () => Promise<string>] | null {
	const key = `../examples/${component}/${name}.tsx`;
	const loadModule = _modules[key];
	const loadSource = _sources[key];

	if (!loadModule || !loadSource) return null;

	return [loadModule, loadSource];
}

function loadExample(component: string, name: string): Promise<ExampleResult> {
	const key = `${component}/${name}`;
	const cached = exampleCache.get(key);
	if (cached) return cached;

	const match = findExample(component, name);
	if (!match) {
		const promise = Promise.resolve({
			error: new Error(`Example not found: ${component}/${name}`),
			ok: false,
		} satisfies ExampleResult);
		exampleCache.set(key, promise);
		return promise;
	}

	const [loadModule, loadSource] = match;
	const promise = Promise.all([loadModule(), loadSource()])
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

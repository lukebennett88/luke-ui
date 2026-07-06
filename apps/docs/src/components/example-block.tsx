import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { CodeIcon } from 'lucide-react';
import { Suspense, use, useId, useState } from 'react';
import type { ComponentType, JSX } from 'react';
import { StoryWrapper } from '../lib/story-wrapper';

type ExampleProps = {
	component: string;
	description: string;
	name: string;
	title: string;
};

export function ExampleBlock(props: ExampleProps): JSX.Element {
	return (
		<Suspense
			fallback={<div className="rounded-lg border border-fd-border p-4">Loading example…</div>}
		>
			<ExampleContent {...props} />
		</Suspense>
	);
}

const _modules = import.meta.glob<ComponentType>('../examples/*/*.tsx', {
	eager: false,
	import: 'default',
});

function ExampleContent({ component, name, title }: ExampleProps): JSX.Element {
	const result = use(loadExample(component, name));
	const [showCode, setShowCode] = useState(false);
	const codeId = useId();

	if (!result.ok) {
		return (
			<div className="rounded-lg border border-fd-destructive p-4 text-fd-destructive">
				Failed to load example {component}/{name}: {result.error.message}
			</div>
		);
	}

	const [PreviewComponent, source] = result.data;

	return (
		<div className="not-prose overflow-hidden rounded-lg border border-fd-border">
			<div className="flex items-center justify-between gap-2 border-fd-border border-b bg-fd-card px-4 py-2">
				<span className="text-fd-muted-foreground text-sm">{title}</span>
				<button
					aria-controls={codeId}
					aria-expanded={showCode}
					className={buttonVariants({ size: 'sm', variant: 'ghost' })}
					onClick={() => setShowCode((previous) => !previous)}
					type="button"
				>
					<CodeIcon className="size-4" />
					{showCode ? 'Hide code' : 'Show code'}
				</button>
			</div>
			<StoryWrapper>
				<PreviewComponent />
			</StoryWrapper>
			{showCode ? (
				<div id={codeId}>
					<DynamicCodeBlock
						code={source.trim()}
						codeblock={{ className: 'my-0 rounded-none border-x-0 border-b-0 shadow-none' }}
						lang="tsx"
					/>
				</div>
			) : null}
		</div>
	);
}

const _sources = import.meta.glob<string>('../examples/*/*.tsx', {
	eager: false,
	query: '?raw',
	import: 'default',
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
			ok: false,
			error: new Error(`Example not found: ${component}/${name}`),
		} satisfies ExampleResult);
		exampleCache.set(key, promise);
		return promise;
	}

	const [loadModule, loadSource] = match;
	const promise = Promise.all([loadModule(), loadSource()])
		.then(
			([loadedComponent, loadedSource]): ExampleResult => ({
				ok: true,
				data: [loadedComponent, loadedSource],
			}),
		)
		.catch(
			(err): ExampleResult => ({
				ok: false,
				error: err instanceof Error ? err : new Error(String(err)),
			}),
		);

	exampleCache.set(key, promise);
	return promise;
}

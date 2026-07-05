import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { Suspense, use } from 'react';
import type { ComponentType, JSX } from 'react';
import { StoryWrapper } from '../lib/story-wrapper';

type ExampleMeta = {
	description: string;
	title: string;
};

type ExampleModule = {
	default: ComponentType;
	meta: ExampleMeta;
};

type ExampleProps = {
	component: string;
	name: string;
};

type ExampleTuple = [ExampleModule, string];

type ExampleResult = { data: ExampleTuple; ok: true } | { error: Error; ok: false };

const _modules = import.meta.glob<ExampleModule>('../../examples/*/*.tsx', {
	eager: false,
	import: '*',
});

const _sources = import.meta.glob<string>('../../examples/*/*.tsx?raw', {
	eager: false,
	import: 'default',
});

const exampleCache = new Map<string, Promise<ExampleResult>>();

function findExample(
	component: string,
	name: string,
): [() => Promise<ExampleModule>, () => Promise<string>] | null {
	const moduleKey = Object.keys(_modules).find((key) => {
		const match = key.match(/\/examples\/([^/]+)\/(.+)\.tsx$/);
		return match?.[1] === component && match?.[2] === name;
	});
	const sourceKey = Object.keys(_sources).find((key) => {
		const match = key.match(/\/examples\/([^/]+)\/(.+)\.tsx\?raw$/);
		return match?.[1] === component && match?.[2] === name;
	});
	if (!moduleKey || !sourceKey) return null;
	return [_modules[moduleKey]!, _sources[sourceKey]!];
}

function loadExample(component: string, name: string): Promise<ExampleResult> {
	const key = `${component}/${name}`;
	const cached = exampleCache.get(key);
	if (cached) return cached;

	const match = findExample(component, name);
	let promise: Promise<ExampleResult>;
	if (!match) {
		promise = Promise.resolve({
			ok: false,
			error: new Error(`Example not found: ${component}/${name}`),
		});
	} else {
		const [loadModule, loadSource] = match;
		promise = Promise.all([loadModule(), loadSource()])
			.then(
				([loadedModule, loadedSource]): ExampleResult => ({
					ok: true,
					data: [loadedModule, loadedSource],
				}),
			)
			.catch(
				(err): ExampleResult => ({
					ok: false,
					error: err instanceof Error ? err : new Error(String(err)),
				}),
			);
	}
	exampleCache.set(key, promise);
	return promise;
}

function ExampleContent({ component, name }: ExampleProps): JSX.Element {
	const result = use(loadExample(component, name));

	if (!result.ok) {
		return (
			<div className="rounded-lg border border-fd-destructive p-4 text-fd-destructive">
				Failed to load example {component}/{name}: {result.error.message}
			</div>
		);
	}

	const [module, source] = result.data;
	const PreviewComponent = module.default;

	return (
		<Tabs defaultIndex={0} items={['Preview', 'Code']} label={module.meta.title}>
			<Tab>
				<StoryWrapper>
					<PreviewComponent />
				</StoryWrapper>
			</Tab>
			<Tab>
				<DynamicCodeBlock code={source} lang="tsx" />
			</Tab>
		</Tabs>
	);
}

export function Example(props: ExampleProps): JSX.Element {
	return (
		<Suspense
			fallback={<div className="rounded-lg border border-fd-border p-4">Loading example…</div>}
		>
			<ExampleContent {...props} />
		</Suspense>
	);
}

import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import type { JSX } from 'react';
import { Suspense, use } from 'react';
import type { HighlightedSource } from '../lib/highlighted-source.js';

export interface SourceCodeBlockProps {
	src: string;
}

export function SourceCodeBlock({ src }: SourceCodeBlockProps): JSX.Element {
	return (
		<Suspense fallback={<SourceCodeLoadingState />}>
			<SourceCodeContent src={src} />
		</Suspense>
	);
}

// Highlighted sample modules load only when a page renders them.
const highlightedSources = import.meta.glob<HighlightedSource>('../samples/*/*.tsx', {
	eager: false,
	import: 'default',
	query: '?highlight',
});

// The median sample height keeps layout shifts small while a module loads.
const FALLBACK_LINE_COUNT = 10;

const highlightedSourceCache = new Map<string, Promise<HighlightedSource>>();

function SourceCodeContent({ src }: SourceCodeBlockProps) {
	const highlightedSource = use(loadHighlightedSource(src));

	return (
		<CodeBlock className="my-0">
			{/* This trusted HTML comes from the build-time Shiki plugin, not from developer input. */}
			<Pre dangerouslySetInnerHTML={{ __html: highlightedSource.html }} />
		</CodeBlock>
	);
}

function SourceCodeLoadingState() {
	return (
		<CodeBlock allowCopy={false} aria-hidden className="my-0">
			<Pre>
				<code>
					{Array.from({ length: FALLBACK_LINE_COUNT }, (_, index) => (
						<span className="line" key={index}>
							&nbsp;
						</span>
					))}
				</code>
			</Pre>
		</CodeBlock>
	);
}

function loadHighlightedSource(src: string): Promise<HighlightedSource> {
	const cached = highlightedSourceCache.get(src);
	if (cached) return cached;

	const load = highlightedSources[`../samples/${src}.tsx`];
	if (!load) throw new Error(`Source example not found: ${src}`);

	const promise = load();
	highlightedSourceCache.set(src, promise);
	return promise;
}

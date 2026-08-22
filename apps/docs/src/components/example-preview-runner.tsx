import type { ComponentType } from 'react';
import { useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { EXAMPLE_PREVIEW_MINIMUM_HEIGHT } from '../lib/example-preview-protocol.js';
import { StoryWrapper } from '../lib/story-wrapper.js';

const exampleModules = import.meta.glob<{ default: ComponentType }>('../examples/*/*.tsx');

const exampleSourcePattern = /^[a-z0-9-]+\/[a-z0-9-]+$/;

type ExamplePreviewRunnerProps = {
	mode?: 'inset' | 'full-bleed';
	src?: string;
};

export function ExamplePreviewRunner({ mode, src }: ExamplePreviewRunnerProps) {
	const [PreviewComponent, setPreviewComponent] = useState<ComponentType | null>(null);
	const contentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const loadExample = findExample(src);
		if (!loadExample) return;

		let isCurrent = true;
		void loadExample().then((module) => {
			if (isCurrent) setPreviewComponent(() => module.default);
		});

		return () => {
			isCurrent = false;
		};
	}, [src]);

	useEffect(() => {
		const content = contentRef.current;
		const wrapper = content?.parentElement;
		if (!wrapper || window.parent === window) return;

		let reportedHeight: number | undefined;
		const reportHeight = () => {
			const height = Math.max(EXAMPLE_PREVIEW_MINIMUM_HEIGHT, Math.ceil(wrapper.scrollHeight));
			if (height === reportedHeight) return;

			reportedHeight = height;
			window.parent.postMessage({ height, type: 'example-preview:height' }, window.location.origin);
		};

		const observer = new ResizeObserver(reportHeight);
		observer.observe(content);
		observer.observe(wrapper);
		reportHeight();

		return () => observer.disconnect();
	}, [PreviewComponent]);

	if (!PreviewComponent) return null;

	return (
		<StoryWrapper mode={mode} overflow="visible">
			<ErrorBoundary fallback={null}>
				<div data-example-preview ref={contentRef}>
					<PreviewComponent />
				</div>
			</ErrorBoundary>
		</StoryWrapper>
	);
}

function findExample(src: string | undefined): (() => Promise<{ default: ComponentType }>) | null {
	if (!src || !exampleSourcePattern.test(src)) return null;
	return exampleModules[`../examples/${src}.tsx`] ?? null;
}

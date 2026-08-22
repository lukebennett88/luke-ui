import { vars } from '@luke-ui/react/theme';
import { useTheme } from 'next-themes';
import type { ComponentType } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { isTrustedExamplePreviewParentMessage } from '../lib/example-preview-handshake.js';
import type { ExamplePreviewPreviewMessage } from '../lib/example-preview-protocol.js';
import { EXAMPLE_PREVIEW_MINIMUM_HEIGHT } from '../lib/example-preview-protocol.js';
import { StoryWrapper } from '../lib/story-wrapper.js';
import { useDocsThemeIdentity } from './theme-controls.js';

const exampleModules = import.meta.glob<{ default: ComponentType }>('../examples/*/*.tsx');

const exampleSourcePattern = /^[a-z0-9-]+\/[a-z0-9-]+$/;
const EXAMPLE_PREVIEW_POPUP_MINIMUM_HEIGHT = 320;

type ExamplePreviewRunnerProps = {
	mode?: 'inset' | 'full-bleed';
	src?: string;
};

export function ExamplePreviewRunner({ mode, src }: ExamplePreviewRunnerProps) {
	const [preview, setPreview] = useState<
		{ Component: ComponentType; error: null } | { Component: null; error: string } | null
	>(() => {
		return findExample(src)
			? null
			: { Component: null, error: `Example not found: ${src ?? 'missing source'}` };
	});

	useEffect(() => {
		const loadExample = findExample(src);
		if (!loadExample) return;

		let isCurrent = true;
		void loadExample().then(
			(module) => {
				if (isCurrent) setPreview({ Component: module.default, error: null });
			},
			(error) => {
				if (!isCurrent) return;
				setPreview({
					Component: null,
					error: error instanceof Error ? error.message : String(error),
				});
			},
		);

		return () => {
			isCurrent = false;
		};
	}, [src]);

	return (
		<ExamplePreviewDocument
			PreviewComponent={preview?.Component ?? null}
			error={preview?.error ?? null}
			mode={mode}
		/>
	);
}

type ExamplePreviewDocumentProps = {
	PreviewComponent: ComponentType | null;
	error?: string | null;
	mode?: ExamplePreviewRunnerProps['mode'];
};

export function ExamplePreviewDocument({
	PreviewComponent,
	error = null,
	mode,
}: ExamplePreviewDocumentProps) {
	const contentRef = useRef<HTMLDivElement>(null);
	const errorRef = useRef<string | null>(null);
	const { setTheme: setColorMode } = useTheme();
	const { setThemeIdentity } = useDocsThemeIdentity();
	const reportError = useCallback((error: unknown) => {
		const message = error instanceof Error ? error.message : String(error);
		errorRef.current = message;
		postToParent({ message, type: 'example-preview:error' });
	}, []);

	useExamplePreviewBridge({
		PreviewComponent,
		contentRef,
		errorRef,
		setColorMode,
		setThemeIdentity,
	});

	useEffect(() => {
		errorRef.current = error;
		if (error !== null) postToParent({ message: error, type: 'example-preview:error' });
	}, [error]);

	if (!PreviewComponent) return null;

	return (
		<div className="min-h-dvh" style={{ backgroundColor: vars.color.surface.canvas }}>
			<StoryWrapper mode={mode} overflow="visible">
				<ErrorBoundary fallback={null} onError={reportError}>
					<div data-example-preview ref={contentRef}>
						<PreviewComponent />
					</div>
				</ErrorBoundary>
			</StoryWrapper>
		</div>
	);
}

type ExamplePreviewBridgeOptions = {
	PreviewComponent: ComponentType | null;
	contentRef: React.RefObject<HTMLDivElement | null>;
	errorRef: React.RefObject<string | null>;
	setColorMode: (value: string) => void;
	setThemeIdentity: ReturnType<typeof useDocsThemeIdentity>['setThemeIdentity'];
};

function useExamplePreviewBridge({
	PreviewComponent,
	contentRef,
	errorRef,
	setColorMode,
	setThemeIdentity,
}: ExamplePreviewBridgeOptions): void {
	const reportHeightRef = useRef<(force?: boolean) => void>(() => {});

	useEffect(() => {
		const onMessage = (event: MessageEvent) => {
			if (!isTrustedExamplePreviewParentMessage(event, window.location.origin, window.parent)) {
				return;
			}

			if (event.data.type === 'example-preview:request-height') {
				reportHeightRef.current(true);
				if (errorRef.current !== null) {
					postToParent({ message: errorRef.current, type: 'example-preview:error' });
				}
				return;
			}

			setThemeIdentity(event.data.themeIdentity);
			setColorMode(event.data.colorMode);
		};

		window.addEventListener('message', onMessage);
		postToParent({ type: 'example-preview:ready' });
		return () => window.removeEventListener('message', onMessage);
	}, [errorRef, setColorMode, setThemeIdentity]);

	useEffect(() => {
		const content = contentRef.current;
		const wrapper = content?.parentElement;
		if (!content || !wrapper) {
			reportHeightRef.current = () => {};
			return;
		}

		let animationFrame: number | undefined;
		let forceNextReport = false;
		let reportedHeight: number | undefined;
		const reportHeight = () => {
			animationFrame = undefined;
			const height = measurePreviewHeight(content, wrapper);
			if (!forceNextReport && height === reportedHeight) return;

			forceNextReport = false;
			reportedHeight = height;
			postToParent({ height, type: 'example-preview:height' });
		};
		const scheduleHeightReport = (force = false) => {
			forceNextReport ||= force;
			if (animationFrame !== undefined) return;
			animationFrame = requestAnimationFrame(reportHeight);
		};

		reportHeightRef.current = scheduleHeightReport;
		const scheduleObservedHeightReport = () => scheduleHeightReport();
		const resizeObserver = new ResizeObserver(scheduleObservedHeightReport);
		resizeObserver.observe(content);
		resizeObserver.observe(wrapper);
		window.addEventListener('resize', scheduleObservedHeightReport);
		scheduleHeightReport();

		return () => {
			if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
			resizeObserver.disconnect();
			window.removeEventListener('resize', scheduleObservedHeightReport);
			reportHeightRef.current = () => {};
		};
	}, [PreviewComponent, contentRef]);
}

function measurePreviewHeight(content: HTMLElement, wrapper: HTMLElement): number {
	const wrapperRect = wrapper.getBoundingClientRect();
	const minimumHeight = content.querySelector('[aria-haspopup]:not([aria-haspopup="false"])')
		? EXAMPLE_PREVIEW_POPUP_MINIMUM_HEIGHT
		: EXAMPLE_PREVIEW_MINIMUM_HEIGHT;
	return Math.max(
		minimumHeight,
		Math.ceil(window.scrollY + wrapperRect.top + wrapper.scrollHeight),
	);
}

function postToParent(message: ExamplePreviewPreviewMessage): void {
	window.parent.postMessage(message, window.location.origin);
}

function findExample(src: string | undefined): (() => Promise<{ default: ComponentType }>) | null {
	if (!src || !exampleSourcePattern.test(src)) return null;
	return exampleModules[`../examples/${src}.tsx`] ?? null;
}

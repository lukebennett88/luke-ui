import { cx } from '@luke-ui/react/utils';
import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense, useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { useSpinDoctor } from 'spin-doctor';
import { useHydratedColorModeSelection } from '../../components/playground/color-mode-toggle.js';
import {
	EditorSkeleton,
	EditorSkeletonShapeScript,
	LoadingPill,
} from '../../components/playground/editor-skeleton';
import { PreviewToolbar } from '../../components/playground/preview-toolbar';
import { RESIZE_TARGET_MINIMUM_SIZE } from '../../components/playground/resize-target';
import { useIsDesktop } from '../../components/playground/use-is-desktop';
import type { ViewportWidth } from '../../components/playground/viewport-toggle';
import { SiteNav } from '../../components/site-nav.js';
import { useDocsThemeIdentity } from '../../components/theme-controls';
import { withBasePath } from '../../lib/base-path.js';
import rawDefaultCode from '../../lib/playground-default-code.tsx?raw';
import { createPlaygroundPageSession } from '../../lib/playground-handshake';
import { decodeCodeHash, encodeCodeHash } from '../../lib/playground-hash';
import type { PlaygroundAppearanceMessage } from '../../lib/playground-protocol';

const PlaygroundEditor = lazy(() => import('../../components/playground/editor'));

const CODE_DEBOUNCE_MS = 300;

export const Route = createFileRoute('/playground/')({
	component: Playground,
	head: () => ({
		meta: [{ title: 'Playground — Luke UI' }],
	}),
});

function Playground() {
	const { themeIdentity } = useDocsThemeIdentity();
	const colorMode = useHydratedColorModeSelection();
	const [initialCode] = useState(() => {
		if (typeof window === 'undefined') return rawDefaultCode;
		return decodeCodeHash(window.location.hash) ?? rawDefaultCode;
	});
	const { error, markError, markReady, markSuccess, showPreviewLoading } = usePreviewStatus();
	// Owned here (not by EditorSkeleton) so the pill survives the skeleton
	// remounting between loading phases instead of blinking on each one.
	const showEditorPill = useSpinDoctor(true, { delay: 800 });
	const [viewportWidth, setViewportWidth] = useState<ViewportWidth>('100%');
	const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
	const isDesktop = useIsDesktop();
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const sessionRef = useRef(createPlaygroundPageSession());
	const codeRef = useRef(initialCode);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const appearanceRef = useRef<Omit<PlaygroundAppearanceMessage, 'type'> | null>(null);
	appearanceRef.current = colorMode === null ? null : { colorMode, themeIdentity };

	const ports = () => ({
		origin: window.location.origin,
		previewWindow: iframeRef.current?.contentWindow ?? null,
	});

	const postCode = useCallback((code: string) => {
		sessionRef.current.postCode(code, ports());
	}, []);
	const postAppearance = useCallback(() => {
		if (colorMode === null) return;
		sessionRef.current.postAppearance({ colorMode, themeIdentity }, ports());
	}, [colorMode, themeIdentity]);

	useEffect(() => {
		const session = sessionRef.current;
		const onMessage = (event: MessageEvent) => {
			session.handlePreviewMessage(event, ports(), {
				appearance: appearanceRef.current,
				currentCode: codeRef.current,
				onError: markError,
				onReady: markReady,
				onSuccess: markSuccess,
			});
		};

		window.addEventListener('message', onMessage);
		// Cover the race where the iframe announced ready before this listener attached.
		session.postCode(codeRef.current, ports(), { unguarded: true });
		return () => {
			window.removeEventListener('message', onMessage);
			clearTimeout(debounceRef.current);
		};
	}, [markError, markReady, markSuccess]);

	useEffect(() => {
		postAppearance();
	}, [postAppearance]);

	useEffect(() => {
		if (!isPreviewFullscreen) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setIsPreviewFullscreen(false);
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [isPreviewFullscreen]);

	const handleChange = (code: string) => {
		codeRef.current = code;
		clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			history.replaceState(null, '', `#${encodeCodeHash(code)}`);
			postCode(code);
		}, CODE_DEBOUNCE_MS);
	};

	return (
		<div className="flex h-dvh flex-col">
			<SiteNav />
			<Group
				className="min-h-0 flex-1 flex-col! md:flex-row!"
				orientation={isDesktop ? 'horizontal' : 'vertical'}
				resizeTargetMinimumSize={RESIZE_TARGET_MINIMUM_SIZE}
			>
				{/* Pane backgrounds match the Catppuccin Latte/Mocha `editor.background` values in monaco-setup.ts. */}
				<Panel
					className="min-h-0 bg-[#eff1f5] dark:bg-[#1e1e2e]"
					defaultSize="50%"
					minSize={160}
					style={{ overflow: 'hidden' }}
				>
					<div className="h-full min-h-0">
						<ClientOnly
							fallback={
								<>
									<EditorSkeleton code={initialCode} showPill={showEditorPill} />
									<EditorSkeletonShapeScript />
								</>
							}
						>
							<Suspense fallback={<EditorSkeleton code={initialCode} showPill={showEditorPill} />}>
								<PlaygroundEditor
									defaultValue={initialCode}
									onChange={handleChange}
									showLoadingPill={showEditorPill}
								/>
							</Suspense>
						</ClientOnly>
					</div>
				</Panel>
				{/* react-resizable-panels owns hit-testing and the resize cursor at the document level; the grab band is configured by resizeTargetMinimumSize on Group above. */}
				<Separator
					aria-label="Resize editor and preview panels"
					className="relative z-10 shrink-0 block-px inline-auto bg-fd-border after:absolute after:block-1.5 after:inline-16 after:rounded-full after:bg-fd-muted-foreground/50 after:transition-colors after:-translate-x-1/2 after:-translate-y-1/2 after:inset-bs-[50%] after:inset-s-[50%] after:content-[''] data-[separator=active]:after:bg-fd-muted-foreground/80 data-[separator=focus]:after:bg-fd-muted-foreground/80 data-[separator=hover]:after:bg-fd-muted-foreground/65 md:block-auto md:inline-px md:after:block-16 md:after:inline-1.5"
				/>
				<Panel
					className={cx(
						'relative flex min-h-0 flex-col',
						isPreviewFullscreen && 'fixed! inset-0 z-50 size-auto! bg-fd-muted',
					)}
					defaultSize="50%"
					minSize={160}
					style={{ overflow: 'hidden' }}
				>
					<PreviewToolbar
						isFullscreen={isPreviewFullscreen}
						onFullscreenChange={setIsPreviewFullscreen}
						onViewportChange={setViewportWidth}
						viewportWidth={viewportWidth}
					/>
					{error === null ? null : (
						<div
							className="border-fd-border border-b bg-fd-card px-4 py-2 font-mono text-red-600 text-xs dark:text-red-400"
							role="alert"
						>
							{error}
						</div>
					)}
					<div className="min-h-0 flex-1 overflow-auto bg-fd-muted/50 p-2 sm:p-3">
						<div
							className="relative mx-auto h-full overflow-hidden rounded-xl border border-fd-border bg-fd-background transition-[inline-size] duration-200"
							style={{ inlineSize: viewportWidth, maxInlineSize: '100%' }}
						>
							{/* Iframes swallow pointer events, which kills separator drags that cross into the preview — disable them while the separator is engaged. */}
							<iframe
								className="size-full border-0 [[data-group]:has([data-separator=active])_&]:pointer-events-none [[data-group]:has([data-separator=hover])_&]:pointer-events-none"
								ref={iframeRef}
								src={withBasePath('/playground/preview', import.meta.env.BASE_URL)}
								title="Playground preview"
							/>
							<div
								className={cx(
									'absolute inset-0 flex items-center justify-center bg-fd-background/90 transition-[opacity,visibility] duration-200',
									!showPreviewLoading && 'invisible opacity-0',
								)}
								role="status"
							>
								<LoadingPill label="Loading preview" />
							</div>
						</div>
					</div>
				</Panel>
			</Group>
		</div>
	);
}

type PreviewState = { status: 'connecting' } | { status: 'ready'; error: string | null };

type PreviewAction =
	| { type: 'iframe-ready' }
	| { type: 'code-applied' }
	| { type: 'code-error'; message: string };

function previewReducer(state: PreviewState, action: PreviewAction): PreviewState {
	switch (action.type) {
		case 'iframe-ready': {
			if (state.status === 'ready') return state;
			return { error: null, status: 'ready' };
		}
		case 'code-applied': {
			return { error: null, status: 'ready' };
		}
		case 'code-error': {
			return { error: action.message, status: 'ready' };
		}
	}
}

function usePreviewStatus() {
	const [state, dispatch] = useReducer(previewReducer, { status: 'connecting' });
	const showPreviewLoading = useSpinDoctor(state.status === 'connecting', {
		delay: 250,
		minDuration: 200,
	});
	// dispatch is guaranteed stable by React, so these callbacks keep a stable
	// identity across renders without needing it in the dependency array.
	const markError = useCallback((message: string) => dispatch({ message, type: 'code-error' }), []);
	const markReady = useCallback(() => dispatch({ type: 'iframe-ready' }), []);
	const markSuccess = useCallback(() => dispatch({ type: 'code-applied' }), []);

	return {
		error: state.status === 'ready' ? state.error : null,
		markError,
		markReady,
		markSuccess,
		showPreviewLoading,
	};
}

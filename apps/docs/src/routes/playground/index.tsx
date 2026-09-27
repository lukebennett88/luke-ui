import { decodeCodeHash } from '@luke-ui/playground-core/hash';
import { createPlaygroundPageSession } from '@luke-ui/playground-core/protocol';
import type {
	PlaygroundPagePorts,
	PlaygroundPageSession,
	PlaygroundResult,
} from '@luke-ui/playground-core/protocol';
import { cx } from '@luke-ui/react/utils';
import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense, useEffect, useReducer, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { useSpinDoctor } from 'spin-doctor';
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
import { useDocsTheme } from '../../components/theme-controls';
import { withBasePath } from '../../lib/base-path.js';
import { encodeDocsPlaygroundHash } from '../../lib/docs-playground-hash.js';
import { postPlaygroundAppearance } from '../../lib/playground-appearance-message.js';
import type { PlaygroundAppearance } from '../../lib/playground-appearance-message.js';
import rawDefaultCode from '../../lib/playground-default-code.tsx?raw';

const PlaygroundEditor = lazy(() => import('../../components/playground/editor'));

const CODE_DEBOUNCE_MS = 300;

export const Route = createFileRoute('/playground/')({
	component: Playground,
	head: () => ({
		meta: [{ title: 'Playground — Luke UI' }],
	}),
});

function Playground() {
	const { colorModePreference, themeIdentity } = useDocsTheme();
	const [initialCode] = useState(() => {
		if (typeof window === 'undefined') return rawDefaultCode;
		return decodeCodeHash(window.location.hash) ?? rawDefaultCode;
	});
	const { dispatch, error, showPreviewLoading } = usePreviewStatus();
	// Owned here (not by EditorSkeleton) so the pill survives the skeleton
	// remounting between loading phases instead of blinking on each one.
	const showEditorPill = useSpinDoctor(true, { delay: 800 });
	const [viewportWidth, setViewportWidth] = useState<ViewportWidth>('100%');
	const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
	const isDesktop = useIsDesktop();
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const codeRef = useRef(initialCode);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const appearanceRef = useRef<PlaygroundAppearance | null>(null);

	const sessionRef = useRef<PlaygroundPageSession | undefined>(undefined);

	useEffect(() => {
		const session = createPlaygroundPageSession({
			getCode: () => codeRef.current,
			getPorts: () => previewPorts(iframeRef),
			onPreviewReady: (readyPorts) => {
				// The preview applies the theme before it renders the replayed code.
				if (appearanceRef.current !== null) {
					postPlaygroundAppearance(appearanceRef.current, readyPorts);
				}
				dispatch({ type: 'ready' });
			},
			onResult: dispatch,
		});
		sessionRef.current = session;
		const onMessage = (event: MessageEvent) => session.handleMessage(event);

		window.addEventListener('message', onMessage);
		// Cover the race where the iframe announced ready before this listener attached.
		session.resync();
		return () => {
			window.removeEventListener('message', onMessage);
			clearTimeout(debounceRef.current);
			sessionRef.current = undefined;
		};
	}, [dispatch]);

	useEffect(() => {
		const appearance = { colorMode: colorModePreference, themeIdentity };
		appearanceRef.current = appearance;
		postPlaygroundAppearance(appearance, previewPorts(iframeRef));
	}, [colorModePreference, themeIdentity]);

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
			history.replaceState(null, '', `#${encodeDocsPlaygroundHash(code)}`);
			sessionRef.current?.postCode(code);
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

/** Reads the current ports from the iframe ref, so hosts calling this always see live values. */
function previewPorts(iframeRef: RefObject<HTMLIFrameElement | null>): PlaygroundPagePorts {
	return {
		origin: window.location.origin,
		previewWindow: iframeRef.current?.contentWindow ?? null,
	};
}

type PreviewState = { status: 'connecting' } | { status: 'ready'; error: string | null };

type PreviewAction = PlaygroundResult | { type: 'ready' };

function previewReducer(state: PreviewState, action: PreviewAction): PreviewState {
	switch (action.type) {
		case 'ready': {
			if (state.status === 'ready') return state;
			return { error: null, status: 'ready' };
		}
		case 'success': {
			return { error: null, status: 'ready' };
		}
		case 'error': {
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

	return {
		dispatch,
		error: state.status === 'ready' ? state.error : null,
		showPreviewLoading,
	};
}

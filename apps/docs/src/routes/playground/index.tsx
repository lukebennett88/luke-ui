import { cx } from '@luke-ui/react/utils';
import { ClientOnly, createFileRoute, Link } from '@tanstack/react-router';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { Maximize2Icon, Minimize2Icon } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { useSpinDoctor } from 'spin-doctor';
import {
	EditorSkeleton,
	EditorSkeletonShapeScript,
	LoadingPill,
} from '../../components/playground/editor-skeleton';
import { ThemeToggle } from '../../components/playground/theme-toggle';
import { useIsDesktop } from '../../components/playground/use-is-desktop';
import type { ViewportWidth } from '../../components/playground/viewport-toggle';
import { ViewportToggle } from '../../components/playground/viewport-toggle';
import rawDefaultCode from '../../lib/playground-default-code.tsx?raw';
import { decodeCodeHash, encodeCodeHash } from '../../lib/playground-hash';
import type { PlaygroundCodeMessage } from '../../lib/playground-protocol';
import { isPlaygroundPreviewMessage } from '../../lib/playground-protocol';
import { withBasePath } from '../../lib/storybook';

const PlaygroundEditor = lazy(() => import('../../components/playground/editor'));

const CODE_DEBOUNCE_MS = 300;

export const Route = createFileRoute('/playground/')({
	component: Playground,
	head: () => ({
		meta: [{ title: 'Playground — Luke UI' }],
	}),
});

function Playground() {
	const [initialCode] = useState(() => {
		if (typeof window === 'undefined') return rawDefaultCode;
		return decodeCodeHash(window.location.hash) ?? rawDefaultCode;
	});
	const { error, markError, markReady, markSuccess, previewReadyRef, showPreviewLoading } =
		usePreviewStatus();
	// Owned here (not by EditorSkeleton) so the pill survives the skeleton
	// remounting between loading phases instead of blinking on each one.
	const showEditorPill = useSpinDoctor(true, { delay: 800 });
	const [viewportWidth, setViewportWidth] = useState<ViewportWidth>('100%');
	const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
	const isDesktop = useIsDesktop();
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const codeRef = useRef(initialCode);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	const postCode = useCallback(
		(code: string) => {
			const contentWindow = iframeRef.current?.contentWindow;
			if (!previewReadyRef.current || !contentWindow) return;
			const message: PlaygroundCodeMessage = { code, type: 'playground:code' };
			contentWindow.postMessage(message, window.location.origin);
		},
		[previewReadyRef],
	);

	useEffect(() => {
		const onMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;
			if (event.source !== iframeRef.current?.contentWindow) return;
			if (!isPlaygroundPreviewMessage(event.data)) return;
			// Any preview message proves the runner is listening, including a
			// success/error reply to the unguarded initial post below.
			previewReadyRef.current = true;
			markReady();
			if (event.data.type === 'playground:ready') {
				postCode(codeRef.current);
				return;
			}
			if (event.data.type === 'playground:error') {
				markError(event.data.message);
				return;
			}
			markSuccess();
		};

		window.addEventListener('message', onMessage);
		// The iframe may have announced readiness before this listener attached
		// (fast iframe, slow hydration) — deliver the initial code unguarded to
		// cover that race; it is dropped harmlessly if the runner isn't up yet.
		const message: PlaygroundCodeMessage = {
			code: codeRef.current,
			type: 'playground:code',
		};
		iframeRef.current?.contentWindow?.postMessage(message, window.location.origin);
		return () => {
			window.removeEventListener('message', onMessage);
			clearTimeout(debounceRef.current);
		};
		// previewReadyRef, postCode, markError, markReady, and markSuccess are all
		// referentially stable (ref + useCallback/dispatch-based), so this still
		// only runs once per mount despite listing them.
	}, [previewReadyRef, postCode, markError, markReady, markSuccess]);

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
			<header className="flex items-center justify-between gap-4 border-fd-border border-b px-4 py-2">
				<div className="flex items-baseline gap-4">
					<span className="font-medium text-sm">Luke UI Playground</span>
					<Link
						className="text-fd-muted-foreground text-sm underline-offset-4 hover:underline"
						params={{ _splat: '' }}
						to="/docs/$"
					>
						Docs
					</Link>
				</div>
				<div className="flex items-center gap-2">
					<ThemeToggle />
					<ViewportToggle onChange={setViewportWidth} value={viewportWidth} />
					<button
						aria-label="Fullscreen preview"
						className={buttonVariants({ size: 'icon-sm', variant: 'ghost' })}
						onClick={() => setIsPreviewFullscreen(true)}
						title="Fullscreen preview"
						type="button"
					>
						<Maximize2Icon className="size-4" />
					</button>
				</div>
			</header>
			<Group
				className="min-h-0 flex-1 flex-col! md:flex-row!"
				orientation={isDesktop ? 'horizontal' : 'vertical'}
			>
				{/* Pane backgrounds match the Catppuccin Latte/Mocha `editor.background` values in monaco-setup.ts. */}
				<Panel
					className="min-h-0 bg-[#eff1f5] dark:bg-[#1e1e2e]"
					minSize={160}
					defaultSize="50%"
					style={{ overflow: 'hidden' }}
				>
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
				</Panel>
				<Separator
					aria-label="Resize editor and preview panels"
					className="relative z-10 shrink-0 block-px inline-auto cursor-row-resize bg-fd-border before:absolute before:-inset-y-2 before:inset-x-0 before:content-[''] after:absolute after:block-0.5 after:inline-8 after:rounded-full after:bg-fd-border after:transition-colors after:-translate-x-1/2 after:-translate-y-1/2 after:inset-bs-[50%] after:inset-s-[50%] after:content-[''] data-[separator=active]:after:bg-fd-muted-foreground/60 data-[separator=focus]:after:bg-fd-muted-foreground/60 data-[separator=hover]:after:bg-fd-muted-foreground/50 md:block-auto md:inline-px md:cursor-col-resize md:before:inset-y-0 md:before:-inset-x-2 md:after:block-8 md:after:inline-0.5"
				/>
				<Panel
					className={cx(
						'relative flex min-h-0 flex-col',
						isPreviewFullscreen && 'fixed! inset-0 z-50 size-auto! bg-fd-muted',
					)}
					minSize={160}
					defaultSize="50%"
					style={{ overflow: 'hidden' }}
				>
					{isPreviewFullscreen ? (
						<button
							aria-label="Exit fullscreen preview"
							className={buttonVariants({
								className:
									'absolute inset-e-4 z-20 rounded-full! bg-fd-background shadow-sm inset-bs-4',
								size: 'icon-sm',
								variant: 'outline',
							})}
							onClick={() => setIsPreviewFullscreen(false)}
							title="Exit fullscreen preview"
							type="button"
						>
							<Minimize2Icon className="size-4" />
						</button>
					) : null}
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
			return { status: 'ready', error: null };
		}
		case 'code-applied': {
			return { status: 'ready', error: null };
		}
		case 'code-error': {
			return { status: 'ready', error: action.message };
		}
	}
}

function usePreviewStatus() {
	const [state, dispatch] = useReducer(previewReducer, { status: 'connecting' });
	// Read synchronously inside `postCode`, which `handleChange` calls outside
	// React's commit cycle — it can't rely on reducer/render state there.
	const previewReadyRef = useRef(false);
	const showPreviewLoading = useSpinDoctor(state.status === 'connecting', {
		delay: 250,
		minDuration: 200,
	});
	// dispatch is guaranteed stable by React, so these callbacks keep a stable
	// identity across renders without needing it in the dependency array.
	const markError = useCallback((message: string) => dispatch({ type: 'code-error', message }), []);
	const markReady = useCallback(() => dispatch({ type: 'iframe-ready' }), []);
	const markSuccess = useCallback(() => dispatch({ type: 'code-applied' }), []);

	return {
		error: state.status === 'ready' ? state.error : null,
		markError,
		markReady,
		markSuccess,
		previewReadyRef,
		showPreviewLoading,
	};
}

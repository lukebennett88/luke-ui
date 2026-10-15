import { decodeCodeHash } from '@luke-ui/playground-core/hash';
import type {
	PlaygroundPagePorts,
	PlaygroundPageSession,
	PlaygroundResult,
} from '@luke-ui/playground-core/protocol';
import { createPlaygroundPageSession } from '@luke-ui/playground-core/protocol';
import { cx } from '@luke-ui/react/utils';
import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import type { RefObject } from 'react';
import { lazy, Suspense, useEffect, useReducer, useRef, useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { useSpinDoctor } from 'spin-doctor';
import {
	EditorSkeleton,
	EditorSkeletonShapeScript,
	LoadingPill,
} from '../../components/playground/editor-skeleton';
import * as styles from '../../components/playground/playground.css.js';
import { PreviewToolbar } from '../../components/playground/preview-toolbar';
import { RESIZE_TARGET_MINIMUM_SIZE } from '../../components/playground/resize-target';
import { useIsDesktop } from '../../components/playground/use-is-desktop';
import type { ViewportWidth } from '../../components/playground/viewport-toggle';
import { SiteNav } from '../../components/site-nav.js';
import { useDocsTheme } from '../../components/theme-controls';
import { withBasePath } from '../../lib/base-path.js';
import { encodeDocsPlaygroundHash } from '../../lib/docs-playground-hash.js';
import type { PlaygroundAppearance } from '../../lib/playground-appearance-message.js';
import { postPlaygroundAppearance } from '../../lib/playground-appearance-message.js';
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
	const appearanceRef = useRef<PlaygroundAppearance>({
		colorMode: colorModePreference,
		themeIdentity,
	});

	const sessionRef = useRef<PlaygroundPageSession | undefined>(undefined);

	useEffect(() => {
		const session = createPlaygroundPageSession({
			getCode: () => codeRef.current,
			getPorts: () => previewPorts(iframeRef),
			onPreviewReady: (readyPorts) => {
				// The preview applies the theme before it renders the replayed code.
				postPlaygroundAppearance(appearanceRef.current, readyPorts);
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
		<div className={styles.page}>
			<SiteNav />
			<Group
				className={styles.panelGroup}
				orientation={isDesktop ? 'horizontal' : 'vertical'}
				resizeTargetMinimumSize={RESIZE_TARGET_MINIMUM_SIZE}
			>
				{/* Pane backgrounds match the GitHub high-contrast light/dark `editor.background` values in monaco-setup.ts. */}
				<Panel
					className={styles.editorPanel}
					defaultSize="50%"
					minSize={160}
					style={{ overflow: 'hidden' }}
				>
					<div className={styles.editorPanelBody}>
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
				<Separator aria-label="Resize editor and preview panels" className={styles.separator} />
				<Panel
					className={cx(styles.previewPanel, isPreviewFullscreen && styles.previewPanelFullscreen)}
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
						<div className={styles.compileError} role="alert">
							{error}
						</div>
					)}
					<div className={styles.previewCanvas}>
						<div className={styles.previewFrame} style={{ inlineSize: viewportWidth }}>
							{/* Iframes swallow pointer events, which kills separator drags that cross into the preview — disable them while the separator is engaged. */}
							<iframe
								className={styles.previewIframe}
								ref={iframeRef}
								src={withBasePath('/playground/preview', import.meta.env.BASE_URL)}
								title="Playground preview"
							/>
							<div
								className={cx(
									styles.previewLoading,
									!showPreviewLoading && styles.previewLoadingHidden,
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

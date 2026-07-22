import { IconButton } from '@luke-ui/react/icon-button';
import { cx } from '@luke-ui/react/utils';
import { ClientOnly, createFileRoute, Link } from '@tanstack/react-router';
import { lazy, Suspense, useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { useSpinDoctor } from 'spin-doctor';
import { css } from '../../../styled-system/css';
import { useHydratedColorModeSelection } from '../../components/playground/color-mode-toggle.js';
import {
	EditorSkeleton,
	EditorSkeletonShapeScript,
	LoadingPill,
} from '../../components/playground/editor-skeleton';
import { useIsDesktop } from '../../components/playground/use-is-desktop';
import type { ViewportWidth } from '../../components/playground/viewport-toggle';
import { ViewportToggle } from '../../components/playground/viewport-toggle';
import { ThemeControls, useDocsThemeIdentity } from '../../components/theme-controls';
import rawDefaultCode from '../../lib/playground-default-code.tsx?raw';
import { decodeCodeHash, encodeCodeHash } from '../../lib/playground-hash';
import type {
	PlaygroundAppearanceMessage,
	PlaygroundCodeMessage,
} from '../../lib/playground-protocol';
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
	const { themeIdentity } = useDocsThemeIdentity();
	const colorMode = useHydratedColorModeSelection();
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
	const postAppearance = useCallback(() => {
		const contentWindow = iframeRef.current?.contentWindow;
		if (!contentWindow || colorMode === null) return;
		const message: PlaygroundAppearanceMessage = {
			colorMode,
			themeIdentity,
			type: 'playground:appearance',
		};
		contentWindow.postMessage(message, window.location.origin);
	}, [colorMode, themeIdentity]);

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
				postAppearance();
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
	}, [previewReadyRef, postAppearance, postCode, markError, markReady, markSuccess]);

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
		<div className={playgroundStyles.root}>
			<header className={playgroundStyles.header}>
				<div className={playgroundStyles.headerBrand}>
					<span className={playgroundStyles.headerTitle}>Luke UI Playground</span>
					<Link className={playgroundStyles.docsLink} params={{ _splat: '' }} to="/$">
						Docs
					</Link>
				</div>
				<div className={playgroundStyles.controls}>
					<ThemeControls />
					<ViewportToggle onChange={setViewportWidth} value={viewportWidth} />
					<IconButton
						aria-label="Fullscreen preview"
						appearance="ghost"
						icon="expand"
						onPress={() => setIsPreviewFullscreen(true)}
						size="small"
						type="button"
					/>
				</div>
			</header>
			<Group
				className={playgroundStyles.panels}
				orientation={isDesktop ? 'horizontal' : 'vertical'}
			>
				{/* Pane backgrounds match the Catppuccin Latte/Mocha `editor.background` values in monaco-setup.ts. */}
				<Panel
					className={playgroundStyles.editorPanel}
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
					className={playgroundStyles.separator}
				/>
				<Panel
					className={cx(
						playgroundStyles.previewPanel,
						isPreviewFullscreen && playgroundStyles.previewPanelFullscreen,
					)}
					minSize={160}
					defaultSize="50%"
					style={{ overflow: 'hidden' }}
				>
					{isPreviewFullscreen ? (
						<IconButton
							aria-label="Exit fullscreen preview"
							className={playgroundStyles.exitFullscreen}
							icon="minimize"
							onPress={() => setIsPreviewFullscreen(false)}
							size="small"
							type="button"
						/>
					) : null}
					{error === null ? null : (
						<div className={playgroundStyles.error} role="alert">
							{error}
						</div>
					)}
					<div className={playgroundStyles.previewSurface}>
						<div
							className={playgroundStyles.previewFrame}
							style={{ inlineSize: viewportWidth, maxInlineSize: '100%' }}
						>
							{/* Iframes swallow pointer events, which kills separator drags that cross into the preview — disable them while the separator is engaged. */}
							<iframe
								className={playgroundStyles.previewIframe}
								ref={iframeRef}
								src={withBasePath('/playground/preview', import.meta.env.BASE_URL)}
								title="Playground preview"
							/>
							<div
								className={cx(
									playgroundStyles.previewLoading,
									!showPreviewLoading && playgroundStyles.previewLoadingHidden,
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

const playgroundStyles = {
	controls: css({
		alignItems: 'center',
		display: 'flex',
		gap: '200',
		justifyContent: 'space-between',
		'@media (min-width: 640px)': { inlineSize: 'auto', justifyContent: 'flex-start' },
		inlineSize: '100%',
	}),
	docsLink: css({
		color: 'text.secondary',
		fontSize: '100',
		textDecoration: 'none',
		'&:hover': { textDecoration: 'underline' },
	}),
	editorPanel: css({
		backgroundColor: '#eff1f5',
		minBlockSize: '0',
		'.dark &': { backgroundColor: '#1e1e2e' },
	}),
	error: css({
		backgroundColor: 'intent.danger.surface.subtle',
		borderBlockEndColor: 'intent.danger.border',
		borderBlockEndStyle: 'solid',
		borderBlockEndWidth: '1px',
		color: 'intent.danger.text',
		fontFamily: 'family',
		fontSize: '100',
		paddingBlock: '200',
		paddingInline: '400',
	}),
	exitFullscreen: css({
		backgroundColor: 'surface.floating',
		borderRadius: 'full',
		insetBlockStart: '400',
		insetInlineEnd: '400',
		position: 'absolute',
		zIndex: 20,
	}),
	header: css({
		alignItems: 'center',
		borderBlockEndColor: 'border.decorative',
		borderBlockEndStyle: 'solid',
		borderBlockEndWidth: '1px',
		display: 'flex',
		flexWrap: 'wrap',
		gap: '400',
		justifyContent: 'space-between',
		paddingBlock: '200',
		paddingInline: '400',
	}),
	headerBrand: css({
		alignItems: 'baseline',
		display: 'flex',
		gap: '400',
	}),
	headerTitle: css({
		color: 'text.primary',
		fontFamily: 'family',
		fontSize: '100',
		fontWeight: 'label',
	}),
	panels: css({
		display: 'flex',
		flex: '1',
		flexDirection: 'column',
		minBlockSize: '0',
		'@media (min-width: 768px)': { flexDirection: 'row' },
	}),
	previewFrame: css({
		backgroundColor: 'surface.canvas',
		blockSize: '100%',
		borderColor: 'border.decorative',
		borderRadius: 'surface',
		borderStyle: 'solid',
		borderWidth: '1px',
		marginInline: 'auto',
		overflow: 'hidden',
		position: 'relative',
		transitionDuration: '200ms',
		transitionProperty: 'inline-size',
	}),
	previewIframe: css({
		blockSize: '100%',
		border: '0',
		inlineSize: '100%',
		'[data-group]:has([data-separator="active"]) &': { pointerEvents: 'none' },
		'[data-group]:has([data-separator="hover"]) &': { pointerEvents: 'none' },
	}),
	previewLoading: css({
		alignItems: 'center',
		backgroundColor: 'surface.canvas',
		blockSize: '100%',
		display: 'flex',
		inset: '0',
		justifyContent: 'center',
		opacity: '0.9',
		position: 'absolute',
		transitionDuration: '200ms',
		transitionProperty: 'opacity, visibility',
		inlineSize: '100%',
	}),
	previewLoadingHidden: css({ opacity: '0', visibility: 'hidden' }),
	previewPanel: css({
		display: 'flex',
		flexDirection: 'column',
		minBlockSize: '0',
		position: 'relative',
	}),
	previewPanelFullscreen: css({
		backgroundColor: 'surface.recessed',
		blockSize: 'auto!',
		inset: '0',
		inlineSize: 'auto!',
		position: 'fixed!',
		zIndex: 50,
	}),
	previewSurface: css({
		backgroundColor: 'surface.recessed',
		flex: '1',
		minBlockSize: '0',
		overflow: 'auto',
		padding: '200',
		'@media (min-width: 640px)': { padding: '300' },
	}),
	root: css({ blockSize: '100dvh', display: 'flex', flexDirection: 'column' }),
	separator: css({
		backgroundColor: 'border.decorative',
		blockSize: '1px',
		cursor: 'row-resize',
		flexShrink: '0',
		inlineSize: 'auto',
		position: 'relative',
		zIndex: 10,
		'&::after': {
			backgroundColor: 'border.decorative',
			blockSize: '2px',
			borderRadius: 'full',
			content: '""',
			inlineSize: 'token(spacing.800)',
			insetBlockStart: '50%',
			insetInlineStart: '50%',
			position: 'absolute',
			transform: 'translate(-50%, -50%)',
			transitionProperty: 'background-color',
		},
		'&::before': {
			content: '""',
			insetBlock: '-200',
			insetInline: '0',
			position: 'absolute',
		},
		'&[data-separator="active"]::after, &[data-separator="focus"]::after': {
			backgroundColor: 'text.secondary',
		},
		'&[data-separator="hover"]::after': {
			backgroundColor: 'border.control',
		},
		'@media (min-width: 768px)': {
			blockSize: 'auto',
			cursor: 'col-resize',
			inlineSize: '1px',
			'&::after': { blockSize: 'token(spacing.800)', inlineSize: '2px' },
			'&::before': {
				insetBlock: '0',
				insetInline: '-200',
			},
		},
	}),
};

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

import { cx } from '@luke-ui/react/utils';
import { ClientOnly, createFileRoute, Link } from '@tanstack/react-router';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useSpinDoctor } from 'spin-doctor';
import {
	EditorSkeleton,
	EditorSkeletonShapeScript,
	LoadingPill,
} from '../../components/playground/editor-skeleton';
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
		return typeof window === 'undefined'
			? rawDefaultCode
			: (decodeCodeHash(window.location.hash) ?? rawDefaultCode);
	});
	const [error, setError] = useState<string | null>(null);
	const [isPreviewLoading, setIsPreviewLoading] = useState(true);
	// Owned here (not by EditorSkeleton) so the pill survives the skeleton
	// remounting between loading phases instead of blinking on each one.
	const showEditorPill = useSpinDoctor(true, { delay: 800 });
	const showPreviewLoading = useSpinDoctor(isPreviewLoading, {
		delay: 250,
		minDuration: 200,
	});
	const [viewportWidth, setViewportWidth] = useState<ViewportWidth>('100%');
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const codeRef = useRef(initialCode);
	const previewReadyRef = useRef(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	const postCode = (code: string) => {
		const contentWindow = iframeRef.current?.contentWindow;
		if (!previewReadyRef.current || !contentWindow) return;
		const message: PlaygroundCodeMessage = { code, type: 'luke-playground:code' };
		contentWindow.postMessage(message, window.location.origin);
	};

	useEffect(() => {
		const onMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;
			if (event.source !== iframeRef.current?.contentWindow) return;
			if (!isPlaygroundPreviewMessage(event.data)) return;
			// Any preview message proves the runner is listening, including a
			// success/error reply to the unguarded initial post below.
			previewReadyRef.current = true;
			setIsPreviewLoading(false);
			if (event.data.type === 'luke-playground:ready') {
				postCode(codeRef.current);
				return;
			}
			if (event.data.type === 'luke-playground:error') {
				setError(event.data.message);
				return;
			}
			setError(null);
		};

		window.addEventListener('message', onMessage);
		// The iframe may have announced readiness before this listener attached
		// (fast iframe, slow hydration) — deliver the initial code unguarded to
		// cover that race; it is dropped harmlessly if the runner isn't up yet.
		const message: PlaygroundCodeMessage = {
			code: codeRef.current,
			type: 'luke-playground:code',
		};
		iframeRef.current?.contentWindow?.postMessage(message, window.location.origin);
		return () => {
			window.removeEventListener('message', onMessage);
			clearTimeout(debounceRef.current);
		};
	}, []);

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
				<ViewportToggle onChange={setViewportWidth} value={viewportWidth} />
			</header>
			<div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
				{/* Pane backgrounds match the Catppuccin Latte/Mocha `editor.background` values in monaco-setup.ts. */}
				<div className="min-h-0 bg-[#eff1f5] border-fd-border max-md:border-b md:border-r dark:bg-[#1e1e2e]">
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
				<div className="flex min-h-0 flex-col">
					{error === null ? null : (
						<div
							className="border-fd-border border-b bg-fd-card px-4 py-2 font-mono text-red-600 text-xs dark:text-red-400"
							role="alert"
						>
							{error}
						</div>
					)}
					<div className="min-h-0 flex-1 overflow-auto bg-fd-muted/50">
						<div
							className={cx(
								'relative mx-auto h-full transition-[width] duration-200',
								viewportWidth !== '100%' && 'border-fd-border border-x',
							)}
							style={{ width: viewportWidth }}
						>
							<iframe
								className="size-full border-0"
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
				</div>
			</div>
		</div>
	);
}

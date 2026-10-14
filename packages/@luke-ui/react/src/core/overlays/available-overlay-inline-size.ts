import { useSyncExternalStore } from 'react';

/** React Aria's `useOverlayPosition` default for `containerPadding`. */
const DEFAULT_OVERLAY_CONTAINER_PADDING = 12;

export function resolveOverlayContainerPadding(
	containerPadding: number | undefined,
	contextContainerPadding: number | undefined,
): number {
	return containerPadding ?? contextContainerPadding ?? DEFAULT_OVERLAY_CONTAINER_PADDING;
}

/** Available inline size inside React Aria's body/html boundary after `containerPadding`. */
export function useAvailableOverlayInlineSize(containerPadding: number): number {
	const viewportInlineSize = useSyncExternalStore(
		subscribeToOverlayViewportInlineSize,
		readOverlayViewportInlineSize,
		getServerSnapshot,
	);

	return Math.max(0, viewportInlineSize - 2 * containerPadding);
}

// Prefer visualViewport when present so the cap tracks React Aria during pinch zoom. Root `cqi`
// matches layout width without a classic scrollbar, but not the visual viewport.
function readOverlayViewportInlineSize(): number {
	return window.visualViewport?.width ?? document.documentElement.clientWidth;
}

function subscribeToOverlayViewportInlineSize(onStoreChange: () => void): () => void {
	// Classic scrollbars can change clientWidth without a window resize.
	const observer = new ResizeObserver(onStoreChange);
	observer.observe(document.documentElement);
	window.visualViewport?.addEventListener('resize', onStoreChange);

	return () => {
		observer.disconnect();
		window.visualViewport?.removeEventListener('resize', onStoreChange);
	};
}

function getServerSnapshot(): number {
	return 0;
}

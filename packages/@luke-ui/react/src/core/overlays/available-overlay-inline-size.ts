import { useSyncExternalStore } from 'react';

/** React Aria's `useOverlayPosition` default for `containerPadding`. */
const DEFAULT_OVERLAY_CONTAINER_PADDING = 12;

export function resolveOverlayContainerPadding(
	containerPadding: number | undefined,
	contextContainerPadding: number | undefined,
): number {
	return containerPadding ?? contextContainerPadding ?? DEFAULT_OVERLAY_CONTAINER_PADDING;
}

/**
 * Available inline size inside React Aria's body/html boundary after `containerPadding`.
 * Subscribe only while `isOpen` so closed fields do not attach observers.
 */
export function useAvailableOverlayInlineSize(containerPadding: number, isOpen: boolean): number {
	const viewportInlineSize = useSyncExternalStore(
		isOpen ? subscribeToOverlayViewportInlineSize : subscribeIdle,
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

const overlayViewportListeners = new Set<() => void>();
let rootResizeObserver: ResizeObserver | null = null;

function notifyOverlayViewportListeners(): void {
	for (const listener of overlayViewportListeners) listener();
}

function subscribeToOverlayViewportInlineSize(onStoreChange: () => void): () => void {
	overlayViewportListeners.add(onStoreChange);
	if (overlayViewportListeners.size === 1) {
		// Classic scrollbars can change clientWidth without a window resize.
		rootResizeObserver = new ResizeObserver(notifyOverlayViewportListeners);
		rootResizeObserver.observe(document.documentElement);
		window.visualViewport?.addEventListener('resize', notifyOverlayViewportListeners);
	}

	return () => {
		overlayViewportListeners.delete(onStoreChange);
		if (overlayViewportListeners.size > 0) return;
		rootResizeObserver?.disconnect();
		rootResizeObserver = null;
		window.visualViewport?.removeEventListener('resize', notifyOverlayViewportListeners);
	};
}

function subscribeIdle(): () => void {
	return () => {};
}

function getServerSnapshot(): number {
	return 0;
}

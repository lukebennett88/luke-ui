import { useSyncExternalStore } from 'react';

/**
 * React Aria's `useOverlayPosition` default for `containerPadding`. Kept here so Select and
 * Combobox popovers cap their width against the same clearance they position with.
 */
export const DEFAULT_OVERLAY_CONTAINER_PADDING = 12;

/**
 * Inline size of the overlay boundary React Aria uses for `body` / `html`: the visual viewport
 * when present, otherwise the layout viewport (`documentElement.clientWidth`). This excludes a
 * classic vertical scrollbar, unlike `100vw`.
 */
function readOverlayViewportInlineSize(): number {
	return window.visualViewport?.width ?? document.documentElement.clientWidth;
}

/**
 * Largest popover inline size that still fits inside `viewportInlineSize` after React Aria's
 * container padding on both sides.
 */
export function availableInlineSizeForContainerPadding(
	containerPadding: number,
	viewportInlineSize: number,
): number {
	return Math.max(0, viewportInlineSize - 2 * containerPadding);
}

/** Subscribe to layout and visual viewport inline-size changes. */
export function useOverlayViewportInlineSize(): number {
	return useSyncExternalStore(subscribe, readOverlayViewportInlineSize, getServerSnapshot);
}

type StoreListener = () => void;

function subscribe(onStoreChange: StoreListener): StoreListener {
	window.visualViewport?.addEventListener('resize', onStoreChange);
	window.addEventListener('resize', onStoreChange);

	return () => {
		window.visualViewport?.removeEventListener('resize', onStoreChange);
		window.removeEventListener('resize', onStoreChange);
	};
}

function getServerSnapshot(): number {
	return 0;
}

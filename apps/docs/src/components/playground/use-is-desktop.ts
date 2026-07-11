import { useSyncExternalStore } from 'react';

export const DESKTOP_MEDIA_QUERY = '(min-width: 768px)';

export function useIsDesktop() {
	return useSyncExternalStore(
		subscribeToDesktopMediaQuery,
		getIsDesktopSnapshot,
		getIsDesktopServerSnapshot,
	);
}

function subscribeToDesktopMediaQuery(onStoreChange: () => void) {
	const mediaQueryList = window.matchMedia(DESKTOP_MEDIA_QUERY);
	mediaQueryList.addEventListener('change', onStoreChange);
	return () => {
		mediaQueryList.removeEventListener('change', onStoreChange);
	};
}

function getIsDesktopSnapshot() {
	return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

function getIsDesktopServerSnapshot() {
	return false;
}

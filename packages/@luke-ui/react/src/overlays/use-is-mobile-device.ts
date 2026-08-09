import { useSyncExternalStore } from 'react';

const mobileScreenWidth = 700;

function subscribe(onStoreChange: () => void): () => void {
	window.addEventListener('resize', onStoreChange);

	return () => {
		window.removeEventListener('resize', onStoreChange);
	};
}

function getSnapshot(): boolean {
	return window.screen.width <= mobileScreenWidth;
}

function getServerSnapshot(): boolean {
	return false;
}

/** Based on Apache-2.0 `packages/@adobe/react-spectrum/src/utils/useIsMobileDevice.ts`. */
export function useIsMobileDevice(): boolean {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

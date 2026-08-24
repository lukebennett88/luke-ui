import { useSyncExternalStore } from 'react';
import { breakpoints } from '../theme/breakpoints.js';

/**
 * Reports whether the current device is a mobile one, so an overlay can switch to
 * the tray architecture.
 *
 * This reads the device screen width on purpose, not the viewport width. Narrowing
 * a desktop browser window must not swap the overlay architecture underneath the
 * user. Mobile means a screen narrower than the shared 640px breakpoint.
 *
 * Based on Apache-2.0 `packages/@adobe/react-spectrum/src/utils/useIsMobileDevice.ts`.
 */
export function useIsMobileDevice(): boolean {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

type StoreListener = () => void;

function subscribe(onStoreChange: StoreListener): StoreListener {
	window.addEventListener('resize', onStoreChange);

	return () => {
		window.removeEventListener('resize', onStoreChange);
	};
}

function getSnapshot(): boolean {
	return window.screen.width < breakpoints.bp640;
}

function getServerSnapshot(): boolean {
	return false;
}

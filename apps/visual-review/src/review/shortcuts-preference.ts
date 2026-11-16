import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'visual-review:shortcuts';
const listeners = new Set<() => void>();
/** The choice storage refused to keep. It then lasts until the page reloads. */
let unsaved: boolean | undefined;

/**
 * Whether single-key shortcuts are on. They can interfere with speech input and other assistive
 * technology, so someone can turn them off, and the choice persists in this browser.
 */
export function useShortcutsEnabled(): boolean {
	return useSyncExternalStore(subscribe, readShortcutsEnabled);
}

export function setShortcutsEnabled(isEnabled: boolean): void {
	try {
		if (isEnabled) localStorage.removeItem(STORAGE_KEY);
		else localStorage.setItem(STORAGE_KEY, 'off');
		unsaved = undefined;
	} catch {
		// Storage can be unavailable or full.
		unsaved = isEnabled;
	}
	for (const listener of listeners) listener();
}

function readShortcutsEnabled() {
	if (unsaved !== undefined) return unsaved;
	try {
		return localStorage.getItem(STORAGE_KEY) !== 'off';
	} catch {
		return true;
	}
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

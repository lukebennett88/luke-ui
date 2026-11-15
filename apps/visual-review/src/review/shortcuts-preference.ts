import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'visual-review:shortcuts';
const listeners = new Set<() => void>();

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
	} catch {
		// Storage can be unavailable. The choice then lasts until the page reloads.
		isEnabledWithoutStorage = isEnabled;
	}
	for (const listener of listeners) listener();
}

let isEnabledWithoutStorage = true;

function readShortcutsEnabled() {
	try {
		return localStorage.getItem(STORAGE_KEY) !== 'off';
	} catch {
		return isEnabledWithoutStorage;
	}
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	window.addEventListener('storage', listener);
	return () => {
		listeners.delete(listener);
		window.removeEventListener('storage', listener);
	};
}

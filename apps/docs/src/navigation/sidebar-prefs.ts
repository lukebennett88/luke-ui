import {
	applySidebarCollapsed,
	parseIsSidebarCollapsed,
	SIDEBAR_STORAGE_KEY,
} from './sidebar-prefs-shared.js';

/**
 * Reads whether the docs sidebar is collapsed from `<html>`, where the head script applied the
 * stored pref before paint. Reading the applied state keeps the toggle working when storage fails.
 */
export function getIsSidebarCollapsedSnapshot() {
	return document.documentElement.dataset.docsSidebar === 'collapsed';
}

/** A static render always shows the sidebar. The head script hides it before paint when stored. */
export function getServerIsSidebarCollapsedSnapshot() {
	return false;
}

/** Stores the pref and applies it to `<html>`. A failed write still applies it to this page. */
export function writeIsSidebarCollapsed(isCollapsed: boolean) {
	try {
		localStorage.setItem(SIDEBAR_STORAGE_KEY, isCollapsed ? 'collapsed' : 'expanded');
	} catch {
		// Storage can be unavailable, for example in some private windows.
	}
	applySidebarCollapsed(document.documentElement, isCollapsed);
	emitChange();
}

/** Follows pref changes from this tab and other tabs. */
export function subscribeToSidebarPref(listener: () => void) {
	if (listeners.size === 0) window.addEventListener('storage', handleStorage);
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
		if (listeners.size === 0) window.removeEventListener('storage', handleStorage);
	};
}

const listeners = new Set<() => void>();

function emitChange() {
	for (const listener of listeners) listener();
}

function handleStorage(event: StorageEvent) {
	if (event.key !== null && event.key !== SIDEBAR_STORAGE_KEY) return;
	applySidebarCollapsed(document.documentElement, readStoredIsSidebarCollapsed());
	emitChange();
}

function readStoredIsSidebarCollapsed() {
	try {
		return parseIsSidebarCollapsed(localStorage.getItem(SIDEBAR_STORAGE_KEY));
	} catch {
		return false;
	}
}

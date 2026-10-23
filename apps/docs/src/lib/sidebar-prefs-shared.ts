/**
 * The pure, dependency-free pieces of the docs sidebar pref. `sidebar-prefs.ts` and the pre-paint
 * head script in `theme-prefs-script.ts` both import from here, so the store and the script share
 * one implementation. Like `theme-prefs-shared.ts`, this module must keep importing nothing: `vp
 * pack` inlines everything the head script imports.
 */

export const SIDEBAR_STORAGE_KEY = 'luke-ui-docs-sidebar';

/** `<html>` carries `data-docs-sidebar="collapsed"` while the docs sidebar is hidden. */
export const SIDEBAR_COLLAPSED_SELECTOR = 'html[data-docs-sidebar="collapsed"]';
export const SIDEBAR_EXPANDED_SELECTOR = 'html:not([data-docs-sidebar="collapsed"])';

/** Parses a stored value, treating a missing or unknown value as expanded. */
export function parseIsSidebarCollapsed(value: string | null): boolean {
	return value === 'collapsed';
}

/** Sets or clears the attribute that the docs shell CSS reads to hide the sidebar. */
export function applySidebarCollapsed(root: HTMLElement, isCollapsed: boolean) {
	if (isCollapsed) root.dataset.docsSidebar = 'collapsed';
	else delete root.dataset.docsSidebar;
}

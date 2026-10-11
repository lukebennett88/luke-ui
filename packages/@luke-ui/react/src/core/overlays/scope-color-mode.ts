import type { RefObject } from 'react';

/** An explicit colour mode. */
type ColorMode = 'light' | 'dark';

/**
 * Returns a callback ref for a portalled overlay element. When the element is created, it copies
 * the trigger's scoped colour mode onto it, unless the element already carries `data-color-mode`.
 * The copy happens once per element, before paint, and does not follow later changes to the scope.
 */
export function copyScopeColorMode(
	triggerRef: RefObject<Element | null> | null | undefined,
): (element: HTMLElement | null) => void {
	return (element) => {
		if (element === null || element.hasAttribute('data-color-mode')) return;
		const mode = resolveScopeMode(triggerRef?.current);
		if (mode !== null) element.setAttribute('data-color-mode', mode);
	};
}

/**
 * Returns the explicit colour mode of the nearest `data-color-mode` scope around `trigger`, or
 * `null` when that scope is `<html>`, holds another value, or does not exist. An overlay portalled
 * to `<body>` already follows the document, so only a scope below `<html>` needs copying.
 */
function resolveScopeMode(trigger: Element | null | undefined): ColorMode | null {
	const scope = trigger?.closest('[data-color-mode]');
	if (scope == null || scope === scope.ownerDocument.documentElement) return null;
	const mode = scope.getAttribute('data-color-mode');
	return mode === 'light' || mode === 'dark' ? mode : null;
}

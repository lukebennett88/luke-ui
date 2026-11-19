import { useEffect } from 'react';

export type ReviewShortcuts = Record<string, (() => void) | undefined>;

const NON_TEXT_INPUT_TYPES = new Set(['button', 'checkbox', 'radio', 'range', 'submit']);

/**
 * Runs a handler for an unmodified key press anywhere on the page. Keys typed into a field, and
 * keys a focused control already uses, are left alone. Nothing listens while `isEnabled` is false.
 */
export function useReviewShortcuts(shortcuts: ReviewShortcuts, isEnabled: boolean): void {
	useEffect(() => {
		if (!isEnabled) return;
		function handleKeyDown(event: KeyboardEvent) {
			if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
			if (isTyping(event.target)) return;
			// A focused control, or a capture that scrolls, uses the arrow keys itself.
			if (event.key.startsWith('Arrow') && isFocusedElement(event.target)) return;
			const handler = shortcuts[event.key];
			if (!handler) return;
			event.preventDefault();
			handler();
		}
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isEnabled, shortcuts]);
}

function isTyping(target: EventTarget | null) {
	if (!(target instanceof HTMLElement)) return false;
	if (target.isContentEditable) return true;
	// An open select or menu uses letter keys for typeahead.
	if (target.closest('[role="listbox"], [role="menu"], [role="dialog"]')) return true;
	if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
	// Range, radio, and checkbox inputs take no text, so shortcuts stay live while they have focus.
	return target instanceof HTMLInputElement && !NON_TEXT_INPUT_TYPES.has(target.type);
}

function isFocusedElement(target: EventTarget | null) {
	return target instanceof HTMLElement && target !== document.body;
}

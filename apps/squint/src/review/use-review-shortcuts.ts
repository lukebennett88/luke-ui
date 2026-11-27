import { useEffect, useEffectEvent } from 'react';

/** One row of the shortcuts list, and what each of its keys does to the example in view. */
export type Shortcut = {
	/** The keys as the list shows them, when that differs from the keys of `keys`. */
	display?: string;
	keys: Readonly<Record<string, () => void>>;
	label: string;
};

const NON_TEXT_INPUT_TYPES = new Set(['button', 'checkbox', 'radio', 'range', 'submit']);

/**
 * Runs a shortcut's action for an unmodified key press anywhere on the page. Keys typed into a
 * field, and keys a focused control already uses, are left alone. Nothing listens while `isEnabled`
 * is false. A key runs the action from the latest render, so `shortcuts` can be rebuilt on every
 * render without the listener being attached again.
 */
export function useReviewShortcuts(shortcuts: ReadonlyArray<Shortcut>, isEnabled: boolean): void {
	const shortcutFor = useEffectEvent(
		(key: string) => shortcuts.find((shortcut) => Object.hasOwn(shortcut.keys, key))?.keys[key],
	);
	useEffect(() => {
		if (!isEnabled) return;
		function handleKeyDown(event: KeyboardEvent) {
			if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
			if (isTyping(event.target)) return;
			const handler = shortcutFor(event.key);
			if (!handler) return;
			event.preventDefault();
			handler();
		}
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isEnabled]);
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

import { useEffect, useReducer, useRef } from 'react';

/** How long a copy control shows its "Copied" or error feedback before reverting. */
const COPY_FEEDBACK_DURATION_MS = 1500;

/** Which copy control is showing feedback, and whether its write succeeded. */
export interface ClipboardFeedbackStatus<Key extends string> {
	key: Key;
	state: 'copied' | 'error';
}

/**
 * Copies text and tracks the feedback for the control that asked. `status` names the control by
 * `key` and reverts to `null` after a short delay. `announcement` is text for a polite live region,
 * and it stays after `status` reverts so a screen reader is not interrupted. A failed write keeps
 * the text in the announcement, so it can still be copied by hand.
 */
export function useClipboardFeedback<Key extends string>() {
	const [{ announcement, status }, dispatch] = useReducer(clipboardFeedbackReducer<Key>, {
		announcement: '',
		status: null,
	});
	const timeoutRef = useRef<number | null>(null);

	useEffect(() => {
		return () => {
			if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
		};
	}, []);

	async function copy(key: Key, text: string) {
		if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);

		try {
			await navigator.clipboard.writeText(text);
			dispatch({ key, text, type: 'copied' });
		} catch {
			dispatch({ key, text, type: 'failed' });
		}

		timeoutRef.current = window.setTimeout(() => {
			dispatch({ type: 'reset' });
		}, COPY_FEEDBACK_DURATION_MS);
	}

	return { announcement, copy, status };
}

interface ClipboardFeedbackState<Key extends string> {
	announcement: string;
	status: ClipboardFeedbackStatus<Key> | null;
}

type ClipboardFeedbackAction<Key extends string> =
	| { key: Key; text: string; type: 'copied' | 'failed' }
	| { type: 'reset' };

/** Sets status and announcement together. Reset clears the status only. */
function clipboardFeedbackReducer<Key extends string>(
	state: ClipboardFeedbackState<Key>,
	action: ClipboardFeedbackAction<Key>,
): ClipboardFeedbackState<Key> {
	switch (action.type) {
		case 'copied':
			return {
				announcement: `Copied ${action.text}`,
				status: { key: action.key, state: 'copied' },
			};
		case 'failed':
			return {
				announcement: `Couldn't copy automatically. Please copy manually: ${action.text}.`,
				status: { key: action.key, state: 'error' },
			};
		case 'reset':
			return { ...state, status: null };
	}
}

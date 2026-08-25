import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Inlined from `fumadocs-ui/utils/use-copy-button` to drop the dependency —
 * the hook is 24 lines and has no dependencies of its own.
 *
 * Tracks a transient "copied" state that flips back to `false` after 1.5s.
 * Deliberately has no `onRejected` handler: if `onCopy` rejects, `checked`
 * stays `false` instead of claiming success. Do not add a `.catch()` here —
 * see `page-actions.tsx` for why callers rely on this to surface failures.
 */
export function useCopyButton(onCopy: () => unknown): readonly [boolean, () => void] {
	const [checked, setChecked] = useState(false);
	const callbackRef = useRef(onCopy);
	const timeoutRef = useRef<number | null>(null);

	useEffect(() => {
		callbackRef.current = onCopy;
	}, [onCopy]);

	const onClick = useCallback(() => {
		if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
		void Promise.resolve(callbackRef.current()).then(() => {
			setChecked(true);
			timeoutRef.current = window.setTimeout(() => {
				setChecked(false);
			}, 1500);
		});
	}, []);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
		};
	}, []);

	return [checked, onClick];
}

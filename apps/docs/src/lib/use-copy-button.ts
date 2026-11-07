import { useCallback, useEffect, useRef, useState } from 'react';

/** Tracks temporary feedback for a copy action. */
export function useCopyButton(
	onCopy: () => unknown,
): readonly ['idle' | 'copied' | 'error', () => void] {
	const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
	const callbackRef = useRef(onCopy);
	const timeoutRef = useRef<number | null>(null);

	useEffect(() => {
		callbackRef.current = onCopy;
	}, [onCopy]);

	const onClick = useCallback(() => {
		if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
		setStatus('idle');
		void Promise.resolve()
			.then(() => callbackRef.current())
			.then(
				() => setStatus('copied'),
				() => setStatus('error'),
			)
			.then(() => {
				timeoutRef.current = window.setTimeout(() => setStatus('idle'), 1500);
			});
	}, []);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
		};
	}, []);

	return [status, onClick];
}

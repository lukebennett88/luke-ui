import { useCallback, useEffect, useRef, useState } from 'react';

/** Tracks temporary feedback for a copy action. */
export function useCopyButton(
	onCopy: () => unknown,
): readonly ['idle' | 'copied' | 'error', () => void] {
	const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
	const callbackRef = useRef(onCopy);
	const timeoutRef = useRef<number | null>(null);
	const attemptRef = useRef(0);

	useEffect(() => {
		callbackRef.current = onCopy;
	}, [onCopy]);

	const onClick = useCallback(() => {
		const attempt = ++attemptRef.current;
		if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
		setStatus('idle');
		const finish = (result: 'copied' | 'error') => {
			if (attempt !== attemptRef.current) return;
			setStatus(result);
			timeoutRef.current = window.setTimeout(() => {
				if (attempt === attemptRef.current) setStatus('idle');
			}, 1500);
		};
		try {
			void Promise.resolve(callbackRef.current()).then(
				() => finish('copied'),
				() => finish('error'),
			);
		} catch {
			finish('error');
		}
	}, []);

	useEffect(() => {
		const attempts = attemptRef;
		return () => {
			attempts.current++;
			if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
		};
	}, []);

	return [status, onClick];
}

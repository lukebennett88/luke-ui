import { useRef, useState, useTransition } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components/Button';
import { useSpinDoctor } from 'spin-doctor';

/** Delay before an Action-owned spinner appears. Explicit `isPending` shows immediately. */
export const ACTION_SPINNER_DELAY = 300;

type OnPress = NonNullable<RacButtonProps['onPress']>;

export type PressAction = () => void | Promise<void>;

export interface UsePressActionOptions {
	/** Externally owned pending state. */
	isPending?: boolean;
	/** Synchronous press handler. Runs before `pressAction` when both are set. */
	onPress?: OnPress;
	/** Button-owned async work tracked as a React Action. */
	pressAction?: PressAction;
}

export interface UsePressActionResult {
	/** Error thrown by `pressAction`, if any. Render `PressActionError` to surface it. */
	actionError: unknown;
	/** Resolved pending state from external `isPending` or an in-flight Action. */
	isPendingState: boolean;
	/** Composed press handler that runs `onPress` then starts `pressAction`. */
	onPress: OnPress;
	/** Whether the pending spinner should be visible. */
	showSpinner: boolean;
}

/**
 * Rethrows a `pressAction` failure during render so the nearest Error Boundary can handle it.
 */
export function PressActionError(props: { error: unknown }): null {
	if (props.error != null) {
		throw props.error;
	}
	return null;
}

/**
 * Shared Action/pending plumbing for `Button` and `IconButton`.
 *
 * Runs `pressAction` as a React Action via `startTransition`, fires once while pending, and delays
 * the Action-owned spinner so fast Actions never flash one.
 *
 * Pending UI uses explicit state instead of `useTransition().isPending`, which can stay `true` after
 * a fast-settling async Action. Failures are recorded and rethrown through `PressActionError`.
 */
export function usePressAction(options: UsePressActionOptions): UsePressActionResult {
	const { isPending = false, onPress, pressAction } = options;
	const [, startTransition] = useTransition();
	const [isActionPending, setIsActionPending] = useState(false);
	const [actionError, setActionError] = useState<unknown>(null);
	// Same-tick guard: pending state updates on the next render.
	const isStartingActionRef = useRef(false);

	const isPendingState = isPending || isActionPending;
	const showActionSpinner = useSpinDoctor(isActionPending, {
		delay: ACTION_SPINNER_DELAY,
		minDuration: 0,
		showDuringHydration: false,
	});
	const showSpinner = isPending || showActionSpinner;

	function handlePress(...args: Parameters<OnPress>) {
		onPress?.(...args);

		if (!pressAction) return;
		if (isPending || isActionPending || isStartingActionRef.current) return;

		isStartingActionRef.current = true;
		setIsActionPending(true);
		startTransition(async () => {
			try {
				await pressAction();
			} catch (error) {
				// Defer past the Action thenable so the Error Boundary throw commits cleanly.
				queueMicrotask(() => {
					setActionError(error);
				});
			} finally {
				isStartingActionRef.current = false;
				setIsActionPending(false);
			}
		});
	}

	return {
		actionError,
		isPendingState,
		onPress: handlePress,
		showSpinner,
	};
}

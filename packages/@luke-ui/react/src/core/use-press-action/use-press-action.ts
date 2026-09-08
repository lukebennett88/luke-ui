import { useRef, useTransition } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components/Button';
import { useSpinDoctor } from 'spin-doctor';

/** Delay before an Action-owned spinner appears. Explicit `isPending` shows immediately. */
const ACTION_SPINNER_DELAY = 300;

type OnPress = NonNullable<RacButtonProps['onPress']>;

export type PressAction = () => void | Promise<void>;

export interface UsePressActionOptions {
	/** Externally owned pending state. */
	isPending?: boolean;
	/** Press handler. Runs before `pressAction` when both are set. */
	onPress?: OnPress;
	/** Button-owned operation run as a React Action. */
	pressAction?: PressAction;
}

export interface UsePressActionResult {
	/** Resolved pending state from external `isPending` or an in-flight Action. */
	isPendingState: boolean;
	/** Composed press handler that runs `onPress` then starts `pressAction`. */
	onPress: OnPress;
	/** Whether the pending spinner should be visible. */
	showSpinner: boolean;
}

/**
 * Shared Action/pending plumbing for `Button` and `IconButton`.
 *
 * Runs `pressAction` as a React Action via `useTransition`, fires once while pending, and delays
 * the Action-owned spinner so fast Actions never flash one.
 */
export function usePressAction(options: UsePressActionOptions): UsePressActionResult {
	const { isPending = false, onPress, pressAction } = options;
	const [isActionPending, startTransition] = useTransition();
	// Same-tick guard: `useTransition().isPending` updates on the next render.
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

		if (!pressAction || isPendingState || isStartingActionRef.current) return;

		isStartingActionRef.current = true;
		startTransition(async () => {
			try {
				await pressAction();
			} finally {
				isStartingActionRef.current = false;
			}
		});
	}

	return {
		isPendingState,
		onPress: handlePress,
		showSpinner,
	};
}

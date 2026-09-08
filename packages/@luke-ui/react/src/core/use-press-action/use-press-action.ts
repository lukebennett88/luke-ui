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
	/** Resolved pending state from external `isPending` or an in-flight Action. */
	isPendingState: boolean;
	/** Composed press handler that runs `onPress` then starts `pressAction`. */
	onPress: OnPress;
	/** Whether the pending spinner should be visible. */
	showSpinner: boolean;
}

// #region agent log
function agentLog(hypothesisId: string, location: string, message: string, data: Record<string, unknown>) {
	const entry = { hypothesisId, location, message, data, timestamp: Date.now(), runId: 'post-fix' };
	const g = globalThis as typeof globalThis & { __agentDebugLog?: Array<typeof entry> };
	(g.__agentDebugLog ??= []).push(entry);
	console.info('[agent-debug]', JSON.stringify(entry));
}
// #endregion

/**
 * Shared Action/pending plumbing for `Button` and `IconButton`.
 *
 * Runs `pressAction` as a React Action via `startTransition`, fires once while pending, and delays
 * the Action-owned spinner so fast Actions never flash one.
 *
 * Pending UI state is owned with `useState` rather than `useTransition().isPending`. React's
 * `isPending` can remain `true` after a fast-settling async Action promise completes (the thenable
 * finish update never commits), which left buttons stuck pending. Explicit state clears reliably
 * after `await`, and render-phase error rethrow preserves Error Boundary reporting.
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

	// Throw after every hook so Error Boundaries see Action failures without breaking hook order.
	if (actionError != null) {
		throw actionError;
	}

	// #region agent log
	agentLog('A', 'use-press-action.ts:render', 'usePressAction render', {
		isPending,
		isActionPending,
		isPendingState,
		showSpinner,
		isStarting: isStartingActionRef.current,
		hasPressAction: Boolean(pressAction),
		hasActionError: actionError != null,
	});
	// #endregion

	function handlePress(...args: Parameters<OnPress>) {
		const pressMeta = {
			isPending,
			isActionPending,
			isStarting: isStartingActionRef.current,
			hasPressAction: Boolean(pressAction),
		};
		// #region agent log
		agentLog('B', 'use-press-action.ts:handlePress:entry', 'handlePress entry', pressMeta);
		// #endregion
		onPress?.(...args);

		if (!pressAction) return;
		if (isPending || isActionPending || isStartingActionRef.current) {
			// #region agent log
			agentLog('C', 'use-press-action.ts:handlePress:blocked', 'Action start blocked', pressMeta);
			// #endregion
			return;
		}

		isStartingActionRef.current = true;
		setIsActionPending(true);
		startTransition(async () => {
			const t0 = Date.now();
			// #region agent log
			agentLog('D', 'use-press-action.ts:action:start', 'Action body start', { t0 });
			// #endregion
			try {
				await pressAction();
				// #region agent log
				agentLog('D', 'use-press-action.ts:action:awaited', 'pressAction awaited ok', {
					elapsed: Date.now() - t0,
				});
				// #endregion
			} catch (error) {
				// #region agent log
				agentLog('E', 'use-press-action.ts:action:error', 'pressAction threw', {
					name: error instanceof Error ? error.name : typeof error,
					message: error instanceof Error ? error.message : String(error),
					elapsed: Date.now() - t0,
				});
				// #endregion
				// Escape the Action microtask / act continuum so the render-phase rethrow commits.
				setTimeout(() => {
					setActionError(error);
				}, 0);
			} finally {
				isStartingActionRef.current = false;
				setIsActionPending(false);
				// #region agent log
				agentLog('D', 'use-press-action.ts:action:finally', 'Action finally', {
					elapsed: Date.now() - t0,
				});
				// #endregion
			}
		});
	}

	return {
		isPendingState,
		onPress: handlePress,
		showSpinner,
	};
}

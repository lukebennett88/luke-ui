import { Button } from '@luke-ui/react/button';
import { Lockup, LockupBody, LockupRail } from '@luke-ui/react/lockup';
import { Text } from '@luke-ui/react/text';
import { useEffect, useEffectEvent } from 'react';
import type { ReviewState } from './review-state.js';
import * as styles from './review.css.js';

/** How long the offer to undo a mark stays, paused while it is hovered or focused. */
const UNDO_DURATION = 10_000;

type UndoToastProps = {
	/** The offer runs out. */
	onDismiss: () => void;
	/** Whether the pointer or focus is on the toast, which holds it in place. */
	onHeldChange: (isHeld: boolean) => void;
	onUndo: () => void;
	undo: NonNullable<ReviewState['undo']>;
};

/** The offer to undo the last mark. It leaves on its own unless it is held, or the next mark replaces it. */
export function UndoToast({ onDismiss, onHeldChange, onUndo, undo }: UndoToastProps) {
	const dismiss = useEffectEvent(onDismiss);

	useEffect(() => {
		if (undo.isHeld) return;
		const timer = window.setTimeout(() => dismiss(), UNDO_DURATION);
		return () => window.clearTimeout(timer);
	}, [undo]);

	return (
		<div
			className={styles.toast}
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget)) onHeldChange(false);
			}}
			onFocus={() => onHeldChange(true)}
			onPointerEnter={() => onHeldChange(true)}
			onPointerLeave={() => onHeldChange(false)}
		>
			<Lockup gap="space.12" railAlignment="center">
				<LockupBody renderRoot={(domProps) => <Text {...domProps} lineClamp />}>
					{undo.offer.label}
				</LockupBody>
				<LockupRail>
					<Button onPress={onUndo} prominence="low" size="small">
						Undo
					</Button>
				</LockupRail>
			</Lockup>
		</div>
	);
}

import type { JSX } from 'react';
import type { DialogTriggerProps as RacDialogTriggerProps } from 'react-aria-components/Dialog';
import { DialogTrigger as RacDialogTrigger } from 'react-aria-components/Dialog';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';

type _DialogTriggerOmit = DistributiveOmit<
	RacDialogTriggerProps,
	'children' | 'defaultOpen' | 'isOpen' | 'onOpenChange'
>;

interface _DialogTriggerProps extends _DialogTriggerOmit {
	/** A pressable trigger, such as a `Button`, followed by a `DialogOverlay`. */
	children: RacDialogTriggerProps['children'];
	/** Whether the dialog starts open (uncontrolled). */
	defaultOpen?: RacDialogTriggerProps['defaultOpen'];
	/** Whether the dialog is open (controlled). */
	isOpen?: RacDialogTriggerProps['isOpen'];
	/** Called when the trigger, a close button, or a dismissal changes the open state. */
	onOpenChange?: RacDialogTriggerProps['onOpenChange'];
}

/** Props for `DialogTrigger`. */
export type DialogTriggerProps = Prettify<_DialogTriggerProps>;

/**
 * Connects a pressable trigger to a `DialogOverlay`. Pressing the trigger opens the dialog, and
 * closing the dialog returns focus to the trigger. It renders no element of its own.
 *
 * Leave the open state uncontrolled, or control it with `isOpen` and `onOpenChange`.
 */
export function DialogTrigger(props: DialogTriggerProps): JSX.Element {
	return <RacDialogTrigger {...props} />;
}

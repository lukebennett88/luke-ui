import type { JSX, Ref } from 'react';
import type { ModalOverlayProps as RacModalOverlayProps } from 'react-aria-components/Modal';
import { ModalOverlay as RacModalOverlay } from 'react-aria-components/Modal';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { cx } from '../../../shared/utils/utils.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { dialogOverlay } from './styles.css.js';

type _DialogOverlayOmit = DistributiveOmit<
	RacModalOverlayProps,
	| 'defaultOpen'
	| 'isDismissable'
	| 'isEntering'
	| 'isExiting'
	| 'isKeyboardDismissDisabled'
	| 'isOpen'
	| 'onOpenChange'
	| 'render'
	| 'UNSTABLE_deferUntilEntered'
	| 'UNSTABLE_overrideFocus'
	| 'UNSTABLE_portalContainer'
>;

interface _DialogOverlayProps extends _DialogOverlayOmit {
	/** Whether the dialog starts open (uncontrolled). Omit inside a `DialogTrigger`. */
	defaultOpen?: RacModalOverlayProps['defaultOpen'];
	/**
	 * Whether pressing outside the surface closes the dialog. Set it to `false` while an action is
	 * pending.
	 * @default false
	 */
	isDismissable?: RacModalOverlayProps['isDismissable'];
	/**
	 * Whether Escape is prevented from closing the dialog. Escape closes the dialog even when
	 * `isDismissable` is `false`, so set this to `true` to block it while an action is pending.
	 * @default false
	 */
	isKeyboardDismissDisabled?: RacModalOverlayProps['isKeyboardDismissDisabled'];
	/**
	 * Whether the dialog is open (controlled). Omit inside a `DialogTrigger`, which owns the state.
	 */
	isOpen?: RacModalOverlayProps['isOpen'];
	/** Called when a close button or a dismissal changes the open state. */
	onOpenChange?: RacModalOverlayProps['onOpenChange'];
	/** Forwarded to the backdrop element. */
	ref?: Ref<HTMLDivElement>;
}

/** Props for `DialogOverlay`. */
export type DialogOverlayProps = Prettify<_DialogOverlayProps>;

/**
 * Portals the dialog to `<body>`, paints the backdrop, and owns dismissal. Inside a
 * `DialogTrigger` it follows the trigger's open state. On its own, control it with `isOpen` and
 * `onOpenChange`. Place a `DialogSurface` inside it.
 *
 * The dialog follows the document's colour mode.
 */
export function DialogOverlay(props: DialogOverlayProps): JSX.Element {
	const { className, ...overlayProps } = props;

	return (
		<RacModalOverlay
			{...overlayProps}
			className={composeRenderProps(className, (renderedClassName) =>
				cx(dialogOverlay, renderedClassName),
			)}
		/>
	);
}

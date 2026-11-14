import type { JSX, Ref } from 'react';
import type { ModalOverlayProps as RacModalProps } from 'react-aria-components/Modal';
import { Modal as RacModal } from 'react-aria-components/Modal';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { cx } from '../../../shared/utils/utils.js';
import { ControlSizeContext } from '../../sizing/control-size-context.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { dialogSurface } from './styles.css.js';

// `DialogOverlay` owns the open state and dismissal. React Aria ignores these props on a `Modal`
// inside a `ModalOverlay`, so the surface does not accept them.
type _DialogSurfaceOmit = DistributiveOmit<
	RacModalProps,
	| 'defaultOpen'
	| 'isDismissable'
	| 'isEntering'
	| 'isExiting'
	| 'isKeyboardDismissDisabled'
	| 'isOpen'
	| 'onOpenChange'
	| 'render'
	| 'shouldCloseOnInteractOutside'
	| 'UNSTABLE_deferUntilEntered'
	| 'UNSTABLE_overrideFocus'
	| 'UNSTABLE_portalContainer'
>;

interface _DialogSurfaceProps extends _DialogSurfaceOmit {
	/** Forwarded to the surface element. */
	ref?: Ref<HTMLDivElement>;
}

/** Props for `DialogSurface`. */
export type DialogSurfaceProps = Prettify<_DialogSurfaceProps>;

/**
 * The raised panel inside a `DialogOverlay`. It paints the surface, border, radius, and shadow,
 * fits within the viewport, and scrolls its content when the content is taller than the viewport.
 * Place a `DialogContent` inside it.
 *
 * Controls inside the surface default to the `medium` size. They do not inherit a `Form`'s
 * `controlSize` from outside the dialog.
 */
export function DialogSurface(props: DialogSurfaceProps): JSX.Element {
	const { children, className, ...surfaceProps } = props;

	return (
		<RacModal
			{...surfaceProps}
			className={composeRenderProps(className, (renderedClassName) =>
				cx(dialogSurface, renderedClassName),
			)}
		>
			{composeRenderProps(children, (resolvedChildren) => (
				<ControlSizeContext value="medium">{resolvedChildren}</ControlSizeContext>
			))}
		</RacModal>
	);
}

import type { JSX, Ref } from 'react';
import type { ModalOverlayProps as RacModalProps } from 'react-aria-components/Modal';
import { Modal as RacModal } from 'react-aria-components/Modal';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { cx } from '../../../shared/utils/utils.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { dialogSurface } from './styles.css.js';

type _DialogSurfaceOmit = DistributiveOmit<
	RacModalProps,
	'render' | 'UNSTABLE_deferUntilEntered' | 'UNSTABLE_overrideFocus' | 'UNSTABLE_portalContainer'
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
 * Inside a `DialogOverlay`, the overlay owns the open state and dismissal, as in React Aria.
 */
export function DialogSurface(props: DialogSurfaceProps): JSX.Element {
	const { className, ...surfaceProps } = props;

	return (
		<RacModal
			{...surfaceProps}
			className={composeRenderProps(className, (renderedClassName) =>
				cx(dialogSurface, renderedClassName),
			)}
		/>
	);
}

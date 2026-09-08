import type { JSX, ReactNode, Ref } from 'react';
import { useState } from 'react';
import type { DialogProps } from 'react-aria-components/Dialog';
import { Dialog, OverlayTriggerStateContext } from 'react-aria-components/Dialog';
import { Modal, ModalOverlay } from 'react-aria-components/Modal';
import { cx } from '../../shared/utils/utils.js';
import { rootClassName } from '../../theme/theme.js';
import { mobileDialog, mobileModal, mobileOverlay } from './mobile-overlay.css.js';

interface MobileOverlayProps {
	'aria-describedby'?: DialogProps['aria-describedby'];
	'aria-label'?: DialogProps['aria-label'];
	'aria-labelledby'?: DialogProps['aria-labelledby'];
	children: ReactNode;
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	/** Forwarded to the tray's dialog element. */
	ref?: Ref<HTMLElement>;
}

/**
 * Private mobile tray based on React Spectrum's Apache-2.0 `Tray.tsx` wrapper.
 */
export function MobileOverlay({
	'aria-describedby': ariaDescribedBy,
	'aria-label': ariaLabel,
	'aria-labelledby': ariaLabelledBy,
	children,
	isOpen,
	onOpenChange,
	ref,
}: MobileOverlayProps): JSX.Element {
	const scrollOffset = useScrollOffsetOnOpen(isOpen);

	return (
		// Resets the ambient overlay trigger state. Without this, `Dialog` would read the
		// enclosing combobox's own `OverlayTriggerStateContext` and wire its close and
		// labelling behaviour to that state instead of this tray's own `Modal` state.
		<OverlayTriggerStateContext.Provider value={null}>
			<ModalOverlay
				className={cx(rootClassName, mobileOverlay)}
				isDismissable
				isOpen={isOpen}
				onOpenChange={onOpenChange}
				style={{ top: scrollOffset }}
			>
				<Modal className={mobileModal}>
					<Dialog
						aria-describedby={ariaDescribedBy}
						aria-label={ariaLabel}
						aria-labelledby={ariaLabelledBy}
						className={mobileDialog}
						ref={ref}
					>
						{children}
					</Dialog>
				</Modal>
			</ModalOverlay>
		</OverlayTriggerStateContext.Provider>
	);
}

/**
 * The document scroll offset as it was when the tray last opened.
 *
 * The overlay is absolutely positioned, so it has to be offset by the document scroll position to
 * sit at the top of the viewport. Scroll is locked while the tray is open, so the offset only has
 * to be read at the moment the tray opens — but it does have to be read then, not once for the
 * component's lifetime. The tray is mounted (closed) for as long as its combobox is on the page,
 * and a consumer can scroll any distance before ever opening it.
 *
 * The offset lives in state rather than a ref for two reasons. A ref mutation does not re-render,
 * so the first open would still paint at the stale offset. State also gives the React Compiler a
 * real reactive dependency for the style object, which stops it hoisting the read into a
 * render-once cache slot. The offset is deliberately not cleared on close, so the tray holds its
 * position through the exit transition instead of jumping; the next open overwrites it.
 */
function useScrollOffsetOnOpen(isOpen: boolean): number {
	// `wasOpen` tracks the previous prop so the offset is re-read on the closed-to-open edge only.
	// Re-reading on every render would move the tray while it is open, and re-reading on close
	// would move it mid-exit-transition.
	const [state, setState] = useState(() => ({ scrollOffset: readScrollOffset(), wasOpen: isOpen }));

	if (isOpen === state.wasOpen) return state.scrollOffset;

	const scrollOffset = isOpen ? readScrollOffset() : state.scrollOffset;
	setState({ scrollOffset, wasOpen: isOpen });

	return scrollOffset;
}

function readScrollOffset(): number {
	return typeof window === 'undefined' ? 0 : window.scrollY;
}

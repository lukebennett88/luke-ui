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
		// Clear ambient overlay trigger state so `Dialog` follows this tray's `Modal`, not the
		// enclosing combobox.
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
 * `scrollY` from when the tray last opened. The overlay is absolutely positioned, so it needs that
 * offset to sit at the top of the viewport. Read the value on each open — the tray stays mounted
 * while closed, and the page may have scrolled. Store it in state so opening re-renders and the
 * React Compiler cannot cache the read for the component lifetime. Keep the value through the exit
 * transition; the next open replaces it.
 */
function useScrollOffsetOnOpen(isOpen: boolean): number {
	// Update only on the closed-to-open edge.
	const [state, setState] = useState(() => ({ scrollOffset: readScrollOffset(), wasOpen: isOpen }));

	if (isOpen === state.wasOpen) return state.scrollOffset;

	const scrollOffset = isOpen ? readScrollOffset() : state.scrollOffset;
	setState({ scrollOffset, wasOpen: isOpen });

	return scrollOffset;
}

function readScrollOffset(): number {
	return typeof window === 'undefined' ? 0 : window.scrollY;
}

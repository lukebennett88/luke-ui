import type { JSX, ReactNode, Ref } from 'react';
import type { DialogProps } from 'react-aria-components/Dialog';
import { Dialog, OverlayTriggerStateContext } from 'react-aria-components/Dialog';
import { Modal, ModalOverlay } from 'react-aria-components/Modal';
import * as styles from '../overlays/mobile-overlay.css.js';
import { rootClassName } from '../theme/index.js';
import { cx } from '../utils/index.js';

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
	return (
		// Resets the ambient overlay trigger state. Without this, `Dialog` would read the
		// enclosing combobox's own `OverlayTriggerStateContext` and wire its close and
		// labelling behaviour to that state instead of this tray's own `Modal` state.
		<OverlayTriggerStateContext.Provider value={null}>
			<ModalOverlay
				className={cx(rootClassName, styles.mobileOverlay)}
				isDismissable
				isOpen={isOpen}
				onOpenChange={onOpenChange}
				// The overlay is absolutely positioned, so it has to track the document scroll
				// position to sit at the top of the viewport. Scroll is locked while the tray is
				// open, so this value never has to update.
				style={() => ({ top: typeof window === 'undefined' ? 0 : window.scrollY })}
			>
				<Modal className={styles.mobileModal}>
					<Dialog
						aria-describedby={ariaDescribedBy}
						aria-label={ariaLabel}
						aria-labelledby={ariaLabelledBy}
						className={styles.mobileDialog}
						ref={ref}
					>
						{children}
					</Dialog>
				</Modal>
			</ModalOverlay>
		</OverlayTriggerStateContext.Provider>
	);
}

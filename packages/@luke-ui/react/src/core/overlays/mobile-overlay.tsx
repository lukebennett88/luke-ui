import * as stylex from '@stylexjs/stylex';
import type { JSX, ReactNode, Ref } from 'react';
import type { DialogProps } from 'react-aria-components/Dialog';
import { Dialog, OverlayTriggerStateContext } from 'react-aria-components/Dialog';
import { Modal, ModalOverlay } from 'react-aria-components/Modal';
import { cx } from '../../shared/utils/utils.js';
import { rootClassName } from '../../theme/theme.js';
import { vars } from '../../theme/tokens.stylex.js';

/**
 * Private custom property carrying the tray's bottom safe-area padding, referenced both as a
 * computed key (set) and inside a `var(...)` (read) below. Module-local: StyleX's static analysis
 * requires custom-property names used as object keys to resolve within the same module, so an
 * imported constant does not compile here.
 */
const trayPaddingBlockEnd = '--luke-tray-padding-block-end';

const styles = stylex.create({
	overlay: {
		backgroundColor: vars.color.overlay.backdrop,
		blockSize: '100dvh',
		insetInlineEnd: 0,
		insetInlineStart: 0,
		position: 'absolute',
		transitionDuration: vars.motion.duration.enter,
		transitionProperty: 'opacity',
		transitionTimingFunction: vars.motion.easing.standard,
		// Keep the overlay above consumer page content.
		zIndex: 100,
		'[data-entering]': {
			opacity: 0,
		},
		'[data-exiting]': {
			opacity: 0,
			transitionDuration: vars.motion.duration.exit,
			transitionTimingFunction: vars.motion.easing.exit,
		},
		'@media (prefers-reduced-motion: reduce)': {
			transitionDuration: '0s',
			transitionProperty: 'none',
			'[data-entering]': {
				opacity: 1,
				transitionDuration: '0s',
				transitionProperty: 'none',
			},
			'[data-exiting]': {
				opacity: 1,
				transitionDuration: '0s',
				transitionProperty: 'none',
			},
		},
	},
	modal: {
		[trayPaddingBlockEnd]:
			'calc(max(calc(100dvh - var(--visual-viewport-height)), env(safe-area-inset-bottom, 0px)) + 100vh)',
		backgroundColor: vars.color.surface.floating,
		blockSize: 'calc(var(--visual-viewport-height) - var(--luke-space-sp48))',
		borderEndEndRadius: 0,
		borderEndStartRadius: 0,
		borderStartEndRadius: vars.radius.overlay,
		borderStartStartRadius: vars.radius.overlay,
		borderStyle: 'solid',
		borderWidth: '1px',
		// Physical insets preserve the intended over-constraint for this content-box tray.
		bottom: '-100vh',
		boxShadow: vars.depth.floating,
		boxSizing: 'content-box',
		display: 'flex',
		flexDirection: 'column',
		insetInlineEnd: 0,
		insetInlineStart: 0,
		// Auto inline margins centre the absolutely positioned tray when its width is capped.
		marginInlineEnd: 'auto',
		marginInlineStart: 'auto',
		maxInlineSize: '448px',
		overflow: 'hidden',
		paddingBlockEnd: `var(${trayPaddingBlockEnd})`,
		position: 'absolute',
		// Physical inset paired with `bottom` above.
		top: vars.space.sp48,
		transitionDuration: vars.motion.duration.enter,
		transitionProperty: 'opacity, translate',
		transitionTimingFunction: vars.motion.easing.standard,
		translate: 'none',
		'[data-entering]': {
			opacity: 0,
			translate: '0 calc(100% - 100vh)',
		},
		'[data-exiting]': {
			opacity: 0,
			transitionDuration: vars.motion.duration.exit,
			transitionTimingFunction: vars.motion.easing.exit,
			translate: '0 calc(100% - 100vh)',
		},
		'@media (forced-colors: active)': {
			backgroundColor: 'Canvas',
			borderColor: 'CanvasText',
			boxShadow: 'none',
			forcedColorAdjust: 'auto',
		},
		'@media (prefers-reduced-motion: reduce)': {
			transitionDuration: '0s',
			transitionProperty: 'none',
			'[data-entering]': {
				opacity: 1,
				transitionDuration: '0s',
				transitionProperty: 'none',
				translate: 'none',
			},
			'[data-exiting]': {
				opacity: 1,
				transitionDuration: '0s',
				transitionProperty: 'none',
				translate: 'none',
			},
		},
		// Above the cap, the tray is inset from the viewport edges and needs bottom corners.
		'@media (width > 450px)': {
			borderEndEndRadius: vars.radius.overlay,
			borderEndStartRadius: vars.radius.overlay,
		},
	},
	dialog: {
		display: 'flex',
		flex: 1,
		flexDirection: 'column',
		minBlockSize: 0,
		overflow: 'hidden',
		outlineColor: 'transparent',
		outlineStyle: 'none',
		outlineWidth: 0,
	},
});

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
	const overlay = stylex.props(styles.overlay);
	const modal = stylex.props(styles.modal);
	const dialog = stylex.props(styles.dialog);

	return (
		// Resets the ambient overlay trigger state. Without this, `Dialog` would read the
		// enclosing combobox's own `OverlayTriggerStateContext` and wire its close and
		// labelling behaviour to that state instead of this tray's own `Modal` state.
		<OverlayTriggerStateContext.Provider value={null}>
			<ModalOverlay
				className={cx(rootClassName, overlay.className)}
				isDismissable
				isOpen={isOpen}
				onOpenChange={onOpenChange}
				// The overlay is absolutely positioned, so it has to track the document scroll
				// position to sit at the top of the viewport. Scroll is locked while the tray is
				// open, so this value never has to update.
				style={{
					...overlay.style,
					top: typeof window === 'undefined' ? 0 : window.scrollY,
				}}
			>
				<Modal className={modal.className} style={modal.style}>
					<Dialog
						aria-describedby={ariaDescribedBy}
						aria-label={ariaLabel}
						aria-labelledby={ariaLabelledBy}
						className={dialog.className}
						ref={ref}
						style={dialog.style}
					>
						{children}
					</Dialog>
				</Modal>
			</ModalOverlay>
		</OverlayTriggerStateContext.Provider>
	);
}

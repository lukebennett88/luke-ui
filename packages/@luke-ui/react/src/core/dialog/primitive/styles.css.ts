import { vars } from '../../../theme/contract.css.js';
import { style } from '../../styles/layered-style.css.js';
import { overlayMotion } from '../../styles/overlay-motion.js';
import { surfaceStyle } from '../../styles/surface.js';

// React Aria's `ModalOverlay` sets `--visual-viewport-height` from the visual viewport, which
// shrinks when a virtual keyboard opens. Sizing the overlay to it keeps the centred surface above
// the keyboard. `100dvh` covers the first render, before the property is set.
const visualViewportBlockSize = 'var(--visual-viewport-height, 100dvh)';

const edgeGap = vars.space['16'];

// Safe-area insets are physical. Take the larger side for both inline edges so the gap holds in
// either writing direction.
const inlineEdgeGap = `max(${edgeGap}, env(safe-area-inset-left, 0px), env(safe-area-inset-right, 0px))`;

export const dialogOverlay = style(
	overlayMotion({
		hidden: { opacity: 0 },
		properties: ['opacity'],
		rule: {
			alignItems: 'center',
			backgroundColor: vars.color.background.backdrop,
			blockSize: visualViewportBlockSize,
			boxSizing: 'border-box',
			display: 'flex',
			insetBlockStart: 0,
			insetInline: 0,
			justifyContent: 'center',
			paddingBlockEnd: `max(${edgeGap}, env(safe-area-inset-bottom, 0px))`,
			paddingBlockStart: `max(${edgeGap}, env(safe-area-inset-top, 0px))`,
			paddingInline: inlineEdgeGap,
			position: 'fixed',
			// A floor above application page content. The mobile tray uses the same value.
			zIndex: 100,
		},
	}),
);

const raisedSurface = surfaceStyle('surface.raised');

export const dialogSurface = style(
	overlayMotion({
		hidden: { opacity: 0, translate: `0 ${vars.space['8']}` },
		properties: ['opacity', 'translate'],
		rule: {
			...raisedSurface,
			borderColor: vars.color.border.decorative,
			borderRadius: vars.radius.overlay,
			borderStyle: 'solid',
			borderWidth: vars.borderWidth.thin,
			boxShadow: vars.shadow.overlay,
			boxSizing: 'border-box',
			inlineSize: '28rem',
			maxBlockSize: '100%',
			maxInlineSize: '100%',
			outline: 'none',
			overflowY: 'auto',
			overscrollBehavior: 'contain',
			translate: 'none',
			'@media': {
				'(forced-colors: active)': {
					backgroundColor: 'Canvas',
					borderColor: 'CanvasText',
					boxShadow: 'none',
				},
			},
		},
	}),
);

export const dialogContent = style({
	outline: 'none',
	padding: vars.space['24'],
});

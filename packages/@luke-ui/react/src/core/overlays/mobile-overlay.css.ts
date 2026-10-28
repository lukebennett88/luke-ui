import { createVar } from '@vanilla-extract/css';
import { vars } from '../../theme/contract.css.js';
import { style } from '../styles/layered-style.css.js';
import { overlayMotion } from '../styles/overlay-motion.js';
import { surfaceStyle } from '../styles/surface.js';

const trayPaddingBlockEnd = createVar();

// The scrim strip left above the tray. It is sized to be a comfortable tap target,
// since tapping it is how a pointer user dismisses the sheet.
const trayInsetBlockStart = vars.space['48'];

const trayBorderWidth = '1px';

// React Spectrum caps its tray at this width and centres it, so the sheet does not
// stretch edge to edge on a wide phone or a small foldable. The cap is a border-box width, and
// `box-sizing: content-box` below makes `max-inline-size` cap the content box, so the two borders
// come off it. That keeps the border box at exactly the width the media query below switches on.
const trayMaxInlineSize = '450px';
const trayMaxContentInlineSize = `calc(${trayMaxInlineSize} - ${trayBorderWidth} * 2)`;

// React Aria Components' own `Modal` sets `--visual-viewport-height` from `useViewportSize`, so
// the tray reads the keyboard-shrunk viewport in CSS alone.
const keyboardInset = `calc(100dvh - var(--visual-viewport-height))`;
const safeAreaInset = `env(safe-area-inset-bottom, 0px)`;
const trayPaddingBlockEndValue = `calc(max(${keyboardInset}, ${safeAreaInset}) + 100vh)`;

/** Based on Apache-2.0 React Spectrum `Tray.tsx` and `tray/index.css`. */
export const mobileOverlay = style(
	overlayMotion({
		hidden: { opacity: 0 },
		properties: ['opacity'],
		rule: {
			backgroundColor: vars.color.overlay.backdrop,
			blockSize: '100dvh',
			insetInline: 0,
			position: 'absolute',
			// Nothing else in this package sets a competing z-index, so this is not calibrated
			// against anything of ours. It is a floor meant to sit above consumer page content.
			zIndex: 100,
		},
	}),
);

const overlaySurface = surfaceStyle('surface.raised');

export const mobileModal = style(
	overlayMotion({
		hidden: { opacity: 0, translate: '0 calc(100% - 100vh)' },
		properties: ['opacity', 'translate'],
		rule: {
			...overlaySurface,
			blockSize: `calc(var(--visual-viewport-height) - ${trayInsetBlockStart})`,
			borderColor: vars.color.border.decorative,
			borderEndEndRadius: 0,
			borderEndStartRadius: 0,
			borderStartEndRadius: vars.radius.overlay,
			borderStartStartRadius: vars.radius.overlay,
			borderStyle: 'solid',
			borderWidth: trayBorderWidth,
			// Physical on purpose, paired with `top` below. The two preserve an intended over-constraint
			// that logical block insets would resolve from the wrong edge on a content-box element.
			bottom: '-100vh',
			boxShadow: vars.shadow.floating,
			boxSizing: 'content-box',
			display: 'flex',
			flexDirection: 'column',
			insetInline: 0,
			// The tray is absolutely positioned, so auto inline margins centre it against the
			// zero inline insets once the cap starts clamping its width.
			marginInline: 'auto',
			maxInlineSize: trayMaxContentInlineSize,
			overflow: 'hidden',
			paddingBlockEnd: trayPaddingBlockEnd,
			position: 'absolute',
			// Physical on purpose, paired with `bottom` above. See the note there.
			top: trayInsetBlockStart,
			translate: 'none',
			// Keeps the surface's foreground resets: a second `vars` would replace them.
			vars: {
				...overlaySurface.vars,
				[trayPaddingBlockEnd]: trayPaddingBlockEndValue,
			},

			'@media': {
				'(forced-colors: active)': {
					backgroundColor: 'Canvas',
					borderColor: 'CanvasText',
					boxShadow: 'none',
					forcedColorAdjust: 'auto',
				},
				// Past the cap the tray is inset from the viewport edges, so its bottom corners are
				// no longer flush and have to be rounded like the top ones.
				[`(width > ${trayMaxInlineSize})`]: {
					borderEndEndRadius: vars.radius.overlay,
					borderEndStartRadius: vars.radius.overlay,
				},
			},
		},
	}),
);

export const mobileDialog = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minBlockSize: 0,
	overflow: 'hidden',
	outline: 'none',
});

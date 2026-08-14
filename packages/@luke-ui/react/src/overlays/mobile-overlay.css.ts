import { createVar } from '@vanilla-extract/css';
import { styleInLayer } from '../styles/layered-style.css.js';
import { overlayEnterTransition, overlayExitTransition } from '../styles/overlay-motion.js';
import { vars } from '../theme/contract.css.js';

const trayPaddingBlockEnd = createVar();

// The scrim strip left above the tray. It is sized to be a comfortable tap target,
// since tapping it is how a pointer user dismisses the sheet.
const trayInsetBlockStart = vars.space[1200];

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

// The sheet and its scrim are overlays, so they take the shared overlay motion roles. See
// `styles/overlay-motion.ts` for the roles and the reduced-motion rule that follows from them.
const scrimTransition = overlayEnterTransition(['opacity']);
const scrimExitTransition = overlayExitTransition(['opacity']);

const trayTransition = overlayEnterTransition(['opacity', 'translate']);
const trayExitTransition = overlayExitTransition(['opacity', 'translate']);

/** Based on Apache-2.0 React Spectrum `Tray.tsx` and `tray/index.css`. */
export const mobileOverlay = styleInLayer('recipes', {
	backgroundColor: vars.color.overlay.backdrop,
	blockSize: '100dvh',
	insetInline: 0,
	position: 'absolute',
	transition: scrimTransition,
	// Nothing else in this package sets a competing z-index, so this is not calibrated
	// against anything of ours. It is a floor meant to sit above consumer page content.
	zIndex: 100,

	selectors: {
		'&[data-entering]': {
			opacity: 0,
		},
		'&[data-exiting]': {
			opacity: 0,
			transition: scrimExitTransition,
		},
	},

	'@media': {
		'(prefers-reduced-motion: reduce)': {
			transition: 'none',

			selectors: {
				'&[data-entering]': { opacity: 1, transition: 'none' },
				'&[data-exiting]': { opacity: 1, transition: 'none' },
			},
		},
	},
});

export const mobileModal = styleInLayer('recipes', {
	backgroundColor: vars.color.surface.floating,
	blockSize: `calc(var(--visual-viewport-height) - ${trayInsetBlockStart})`,
	borderEndEndRadius: 0,
	borderEndStartRadius: 0,
	borderStartEndRadius: vars.radius.overlay,
	borderStartStartRadius: vars.radius.overlay,
	borderStyle: 'solid',
	borderWidth: trayBorderWidth,
	// Physical on purpose, paired with `top` below. The two preserve an intended over-constraint
	// that logical block insets would resolve from the wrong edge on a content-box element.
	bottom: '-100vh',
	boxShadow: vars.depth.floating,
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
	transition: trayTransition,
	translate: 'none',
	vars: {
		[trayPaddingBlockEnd]: trayPaddingBlockEndValue,
	},

	selectors: {
		'&[data-entering]': {
			opacity: 0,
			translate: '0 calc(100% - 100vh)',
		},
		'&[data-exiting]': {
			opacity: 0,
			transition: trayExitTransition,
			translate: '0 calc(100% - 100vh)',
		},
	},

	'@media': {
		'(forced-colors: active)': {
			backgroundColor: 'Canvas',
			borderColor: 'CanvasText',
			boxShadow: 'none',
			forcedColorAdjust: 'auto',
		},
		'(prefers-reduced-motion: reduce)': {
			transition: 'none',

			selectors: {
				// Reduced motion has to repeat `none` on each selector. See `styles/overlay-motion.ts`.
				'&[data-entering]': { opacity: 1, transition: 'none', translate: 'none' },
				'&[data-exiting]': { opacity: 1, transition: 'none', translate: 'none' },
			},
		},
		// Past the cap the tray is inset from the viewport edges, so its bottom corners are
		// no longer flush and have to be rounded like the top ones.
		[`(width > ${trayMaxInlineSize})`]: {
			borderEndEndRadius: vars.radius.overlay,
			borderEndStartRadius: vars.radius.overlay,
		},
	},
});

export const mobileDialog = styleInLayer('recipes', {
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minBlockSize: 0,
	overflow: 'hidden',
	outline: 'none',
});

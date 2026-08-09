import { createVar } from '@vanilla-extract/css';
import { styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';

const trayPaddingBlockEnd = createVar();

// The scrim strip left above the tray. It is sized to be a comfortable tap target,
// since tapping it is how a pointer user dismisses the sheet.
const trayMarginBlockStart = vars.space[1200];

// React Spectrum caps its tray at this width and centres it, so the sheet does not
// stretch edge to edge on a wide phone or a small foldable.
const trayMaxInlineSize = '450px';

// The sheet and its scrim are overlays, so they take the enter and exit duration roles rather than
// the in-place feedback one. Entry decelerates with the standard easing curve, while exit
// accelerates with the exit curve.
const scrimTransition = `opacity ${vars.motion.duration.enter} ${vars.motion.easing.standard}`;
const scrimExitTransition = `opacity ${vars.motion.duration.exit} ${vars.motion.easing.exit}`;

const trayTransition = [
	`opacity ${vars.motion.duration.enter} ${vars.motion.easing.standard}`,
	`translate ${vars.motion.duration.enter} ${vars.motion.easing.standard}`,
].join(', ');

const trayExitTransition = [
	`opacity ${vars.motion.duration.exit} ${vars.motion.easing.exit}`,
	`translate ${vars.motion.duration.exit} ${vars.motion.easing.exit}`,
].join(', ');

/** Based on Apache-2.0 React Spectrum `Tray.tsx` and `tray/index.css`. */
export const mobileOverlay = styleInLayer('recipes', {
	backgroundColor: vars.color.scrim,
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
	blockSize: `calc(var(--visual-viewport-height) - ${trayMarginBlockStart})`,
	borderEndEndRadius: 0,
	borderEndStartRadius: 0,
	borderStartEndRadius: vars.radius.overlay,
	borderStartStartRadius: vars.radius.overlay,
	borderStyle: 'solid',
	borderWidth: '1px',
	boxShadow: vars.depth.floating,
	boxSizing: 'content-box',
	display: 'flex',
	flexDirection: 'column',
	// Physical insets preserve the intended overconstraint. Logical block insets resolve the content-box tray from the wrong edge.
	bottom: '-100vh',
	insetInline: 0,
	// The tray is absolutely positioned, so auto inline margins centre it against the
	// zero inline insets once the cap starts clamping its width.
	marginInline: 'auto',
	maxInlineSize: trayMaxInlineSize,
	overflow: 'hidden',
	paddingBlockEnd: trayPaddingBlockEnd,
	position: 'absolute',
	top: trayMarginBlockStart,
	transition: trayTransition,
	translate: 'none',
	vars: {
		[trayPaddingBlockEnd]: `calc(max(calc(100dvh - var(--visual-viewport-height)), env(safe-area-inset-bottom, 0px)) + 100vh)`,
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
				// The entering and exiting selectors above set their own `transition`, which is more
				// specific than the plain class rule here, so reduced motion must repeat `none` on
				// each one too or the sheet keeps animating.
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

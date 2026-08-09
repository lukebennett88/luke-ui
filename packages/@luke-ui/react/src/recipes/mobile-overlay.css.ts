import { createVar } from '@vanilla-extract/css';
import { styleInLayer } from '../styles/layered-style.css.js';
import { vars } from '../theme/contract.css.js';

const trayPaddingBlockEnd = createVar();

const trayTransition = [
	`opacity ${vars.motion.duration.fast} ${vars.motion.easing.standard}`,
	`translate ${vars.motion.duration.fast} ${vars.motion.easing.standard}`,
].join(', ');

/** Based on Apache-2.0 React Spectrum `Tray.tsx` and `tray/index.css`. */
export const mobileOverlay = styleInLayer('recipes', {
	backgroundColor: vars.color.scrim,
	blockSize: '100dvh',
	insetInline: 0,
	position: 'absolute',
	zIndex: 100,
});

export const mobileModal = styleInLayer('recipes', {
	backgroundColor: vars.color.surface.floating,
	blockSize: `calc(var(--visual-viewport-height) - ${vars.space[800]})`,
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
	insetBlockEnd: '-100vh',
	insetBlockStart: vars.space[800],
	insetInline: 0,
	overflow: 'hidden',
	paddingBlockEnd: trayPaddingBlockEnd,
	position: 'absolute',
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
				'&[data-entering]': { opacity: 1, translate: 'none' },
				'&[data-exiting]': { opacity: 1, translate: 'none' },
			},
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

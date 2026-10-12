import { vars } from '@luke-ui/react/theme';
import { createVar, globalStyle, style } from '@vanilla-extract/css';

/** Six caption lines. Viewport padding remains outside the clipped source. */
const collapsedSourceLineCount = 6;
const collapsedSourceMaxBlockSize = `calc(${vars.font.caption.lineHeight} * ${collapsedSourceLineCount})`;

/**
 * Collapsed preview budget. Floors the grid child (so `0fr` settles at six lines) and is read from
 * JS for clip measurement (so an in-flight track size cannot look like a fit).
 */
export const collapsedSourceMaxBlockSizeVar = createVar();

export const codeViewportCollapsed = style({});
export const codeViewportFade = style({});

/**
 * Grid accordion on the scrollport: `0fr` ↔ `1fr` interpolates to content height without
 * `interpolate-size` (see https://css-tricks.com/css-grid-can-do-auto-height-transitions/).
 */
export const codeViewportAnimatable = style({
	'@layer': {
		components: {
			vars: {
				[collapsedSourceMaxBlockSizeVar]: collapsedSourceMaxBlockSize,
			},
			display: 'grid',
			gridTemplateRows: '1fr',
			// Accordion height is one of the few layout animations Emil's recipe allows; keep it short.
			transitionDuration: vars.motion.duration.enter,
			transitionProperty: 'grid-template-rows',
			transitionTimingFunction: vars.motion.easing.standard,
			selectors: {
				[`&${codeViewportCollapsed}`]: {
					gridTemplateRows: '0fr',
				},
			},
			'@media': {
				'(prefers-reduced-motion: reduce)': {
					transitionDuration: '0.01ms',
				},
			},
		},
	},
});

// Grid item: non-visible overflow lets `0fr` shrink past content. The collapsed budget is a constant
// floor so the preview shows six lines and the 0fr↔1fr transition does not dip through height 0.
globalStyle(`${codeViewportAnimatable} pre`, {
	'@layer': {
		components: {
			minBlockSize: collapsedSourceMaxBlockSizeVar,
			overflowY: 'clip',
		},
	},
});

// Fits / unmeasured: no grid transition — just a static clip to the collapsed budget.
globalStyle(`${codeViewportCollapsed}:not(${codeViewportAnimatable}) pre`, {
	'@layer': {
		components: {
			vars: {
				[collapsedSourceMaxBlockSizeVar]: collapsedSourceMaxBlockSize,
			},
			maxBlockSize: collapsedSourceMaxBlockSize,
			overflowY: 'clip',
		},
	},
});

// Keep the scroll region's focus ring and copy control outside the text fade.
globalStyle(`${codeViewportFade} pre`, {
	'@layer': {
		components: {
			maskImage: 'linear-gradient(to bottom, #000 0%, #000 55%, transparent 100%)',
		},
	},
});

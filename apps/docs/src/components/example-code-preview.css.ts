import { vars } from '@luke-ui/react/theme';
import { createVar, globalStyle, style } from '@vanilla-extract/css';

/** Six caption lines. Viewport padding remains outside the clipped source. */
const collapsedSourceLineCount = 6;
const collapsedSourceMaxBlockSize = `calc(${vars.font.caption.lineHeight} * ${collapsedSourceLineCount})`;

/**
 * Target collapsed max-block-size for measurement. Not animated, so JS can read the budget while
 * `max-block-size` interpolates between that length and `none`.
 */
export const collapsedSourceMaxBlockSizeVar = createVar();

export const codeViewportAnimatable = style({});
export const codeViewportCollapsed = style({});
export const codeViewportFade = style({});

// Clip the source and transition max-block-size between the collapsed length and `none`.
// `interpolate-size: allow-keywords` lets Chromium animate that keyword; other engines snap.
// Content stays top-aligned so bottom lines are what the window obscures and discloses; the
// toggle is the sill below this clip, scroll-pinned in the component while height changes.
globalStyle(`${codeViewportAnimatable} pre`, {
	'@layer': {
		components: {
			vars: {
				[collapsedSourceMaxBlockSizeVar]: collapsedSourceMaxBlockSize,
			},
			maxBlockSize: 'none',
			overflowY: 'clip',
			// Accordion height is one of the few layout animations Emil's recipe allows; keep it short.
			transitionDuration: vars.motion.duration.enter,
			transitionProperty: 'max-block-size',
			transitionTimingFunction: vars.motion.easing.standard,
			'@media': {
				'(prefers-reduced-motion: no-preference)': {
					interpolateSize: 'allow-keywords',
				},
				'(prefers-reduced-motion: reduce)': {
					transitionDuration: '0.01ms',
				},
			},
		},
	},
});

globalStyle(`${codeViewportCollapsed} pre`, {
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

import { vars } from '@luke-ui/react/theme';
import { createVar, globalStyle, style } from '@vanilla-extract/css';

/** Six caption lines. Viewport padding remains outside the clipped source. */
export const collapsedSourceLineCount = 6;
const collapsedSourceMaxBlockSize = `calc(${vars.font.caption.lineHeight} * ${collapsedSourceLineCount})`;

/** Pixel max-block-size for the animating source clip. Set only while expand/collapse is available. */
export const sourceMaxBlockSizeVar = createVar();

export const codeViewportAnimatable = style({});
export const codeViewportFade = style({});

// Clip and animate height on the source. Content stays top-aligned so the bottom lines are what
// appear and disappear; the toggle sits on the frame below this clip. `max-block-size` (not
// `block-size`) keeps short sources from being forced taller than their content.
globalStyle(`${codeViewportAnimatable} pre`, {
	'@layer': {
		components: {
			maxBlockSize: sourceMaxBlockSizeVar,
			overflowY: 'clip',
			// Accordion height is one of the few layout animations Emil's recipe allows; keep it short.
			transitionDuration: vars.motion.duration.enter,
			transitionProperty: 'max-block-size',
			transitionTimingFunction: vars.motion.easing.standard,
			'@media': {
				'(prefers-reduced-motion: reduce)': {
					transitionDuration: '0.01ms',
				},
			},
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

/** Fallback when the pixel measure has not landed yet. */
export const codeViewportCollapsedFallback = style({});

globalStyle(`${codeViewportCollapsedFallback} pre`, {
	'@layer': {
		components: {
			maxBlockSize: collapsedSourceMaxBlockSize,
			overflowY: 'clip',
		},
	},
});

import { vars } from '@luke-ui/react/theme';
import { globalStyle, style } from '@vanilla-extract/css';

/** Six caption lines. Viewport padding remains outside the clipped source. */
const collapsedSourceMaxBlockSize = `calc(${vars.font.caption.lineHeight} * 6)`;

export const codeTransitionType = 'luke-docs-example-code';
export const codeUpdate = style({});

// Keep the surrounding article out of the code expansion crossfade.
globalStyle(`:root:active-view-transition-type(${codeTransitionType})::view-transition-old(root)`, {
	'@layer': {
		components: {
			display: 'none',
		},
	},
});

globalStyle(
	[
		`:root:active-view-transition-type(${codeTransitionType})::view-transition-group(root)`,
		`:root:active-view-transition-type(${codeTransitionType})::view-transition-new(root)`,
	].join(', '),
	{
		'@layer': {
			components: {
				animation: 'none',
			},
		},
	},
);

// The group morphs the example's size and position.
globalStyle(`::view-transition-group(.${codeUpdate})`, {
	'@layer': {
		components: {
			animationDuration: vars.motion.duration.enter,
			animationTimingFunction: vars.motion.easing.standard,
			'@media': {
				'(prefers-reduced-motion: reduce)': {
					animationDuration: '0.01ms',
				},
			},
		},
	},
});

// Snapshots keep their natural size and clip to the morphing group, so text is revealed rather
// than stretched. They do not crossfade, so the content is not washed out mid-transition.
globalStyle(
	[`::view-transition-old(.${codeUpdate})`, `::view-transition-new(.${codeUpdate})`].join(', '),
	{
		'@layer': {
			components: {
				animation: 'none',
				blockSize: '100%',
				mixBlendMode: 'normal',
				objectFit: 'none',
				objectPosition: 'top left',
				overflow: 'clip',
			},
		},
	},
);

export const codeViewportCollapsed = style({});
export const codeViewportFade = style({});

// Clip the source vertically so keyboard scrolling cannot reveal hidden lines. `clip`, unlike
// `hidden`, is not a scroll container, so find-in-page cannot scroll clipped lines into view
// either. Horizontal scrolling stays with the viewport.
globalStyle(`${codeViewportCollapsed} pre`, {
	'@layer': {
		components: {
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

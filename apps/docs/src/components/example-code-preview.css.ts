import { vars } from '@luke-ui/react/theme';
import { globalStyle, style } from '@vanilla-extract/css';

/** Six caption lines. Viewport padding remains outside the clipped source. */
const collapsedSourceMaxBlockSize = `calc(${vars.font.caption.lineHeight} * 6)`;

export const codeTransitionType = 'luke-docs-example-code';
export const codeUpdate = style({});

// Keep the surrounding article out of the code expansion crossfade.
globalStyle(`:root:active-view-transition-type(${codeTransitionType})::view-transition-old(root)`, {
	'@layer': {
		recipes: {
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
			recipes: {
				animation: 'none',
			},
		},
	},
);

globalStyle(
	[
		`::view-transition-group(.${codeUpdate})`,
		`::view-transition-old(.${codeUpdate})`,
		`::view-transition-new(.${codeUpdate})`,
	].join(', '),
	{
		'@layer': {
			recipes: {
				animationDuration: vars.motion.duration.enter,
				animationTimingFunction: vars.motion.easing.standard,
				'@media': {
					'(prefers-reduced-motion: reduce)': {
						animationDuration: '0.01ms',
					},
				},
			},
		},
	},
);

/** Reveal the full source when expanded, without CodeBlock's default height cap. */
export const codeViewport = style({
	'@layer': {
		utilities: {
			maxBlockSize: 'none',
		},
	},
});

export const codeViewportCollapsed = style({});
export const codeViewportFade = style({});

// Clip the source itself so keyboard scrolling cannot reveal hidden lines.
globalStyle(`${codeViewportCollapsed} pre`, {
	'@layer': {
		recipes: {
			maxBlockSize: collapsedSourceMaxBlockSize,
			overflow: 'hidden',
		},
	},
});

// Keep the scroll region's focus ring and copy control outside the text fade.
globalStyle(`${codeViewportFade} pre`, {
	'@layer': {
		recipes: {
			maskImage: 'linear-gradient(to bottom, #000 0%, #000 55%, transparent 100%)',
		},
	},
});

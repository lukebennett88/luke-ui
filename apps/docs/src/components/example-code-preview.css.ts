import { vars } from '@luke-ui/react/theme';
import { globalStyle, style } from '@vanilla-extract/css';

export const collapsedLineCount = 6;

export const expanded = style({});

export const collapsible = style({
	'@layer': {
		components: {
			// Collapsing clips lines the browser could otherwise anchor scrolling to. Opting the block
			// out makes the toggle below it the anchor, so the toggle stays put.
			overflowAnchor: 'none',
		},
	},
});

// Animating rows between `0fr` and `1fr` reaches the content height without measuring it. The
// `pre` is the grid so its clip edge moves with the animated height. `clip`, unlike `hidden`, is
// not a scroll container, so keyboard scrolling and find-in-page cannot reveal clipped lines.
globalStyle(`${collapsible} pre`, {
	'@layer': {
		components: {
			display: 'grid',
			gridTemplateRows: '0fr',
			minBlockSize: `calc(${vars.font.label.lineHeight} * ${collapsedLineCount})`,
			overflowY: 'clip',
			transition: `grid-template-rows ${vars.motion.enter.duration} ${vars.motion.enter.easing}`,
			'@media': {
				'(prefers-reduced-motion: reduce)': {
					transition: 'none',
				},
			},
		},
	},
});

globalStyle(`${collapsible}${expanded} pre`, {
	'@layer': {
		components: {
			gridTemplateRows: '1fr',
		},
	},
});

globalStyle(`${collapsible} pre > code`, {
	'@layer': {
		components: {
			minBlockSize: 0,
		},
	},
});

// Keep the scroll region's focus ring and copy control outside the text fade.
globalStyle(`${collapsible}:not(${expanded}) pre`, {
	'@layer': {
		components: {
			maskImage: 'linear-gradient(to bottom, #000 0%, #000 55%, transparent 100%)',
		},
	},
});

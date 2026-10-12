import { vars } from '@luke-ui/react/theme';
import { globalStyle, style } from '@vanilla-extract/css';

/** Source lines the collapsed preview shows. Viewport padding remains outside the clipped source. */
export const collapsedLineCount = 6;

export const expanded = style({});

/**
 * A code block whose source collapses to its first lines. Collapsing clips those lines, so scroll
 * anchoring skips the whole block and anchors to the toggle below it instead. That keeps the
 * toggle still while the block resizes.
 */
export const collapsible = style({
	'@layer': {
		components: {
			overflowAnchor: 'none',
		},
	},
});

// The source row grows from `0fr` to `1fr`, which interpolates to the content height without
// measuring it. The `pre` is the grid container, so its clip edge follows the animated height and
// the bottom lines are disclosed or clipped in step with the frame. `clip`, unlike `hidden`, is not
// a scroll container, so keyboard scrolling and find-in-page cannot reveal clipped lines.
// Horizontal scrolling stays with the viewport.
globalStyle(`${collapsible} pre`, {
	'@layer': {
		components: {
			display: 'grid',
			gridTemplateRows: '0fr',
			minBlockSize: `calc(${vars.font.caption.lineHeight} * ${collapsedLineCount})`,
			overflowY: 'clip',
			transition: `grid-template-rows ${vars.motion.duration.enter} ${vars.motion.easing.standard}`,
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

// Let the row shrink below the source. The lines overflow it into the `pre`, which clips them.
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

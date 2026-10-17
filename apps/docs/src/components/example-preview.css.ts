import { vars } from '@luke-ui/react/theme';
import { globalStyle, style } from '@vanilla-extract/css';
import { docsTabletMinWidthMedia } from '../lib/docs-container-queries.js';

export const MIN_RESIZABLE_CARD_WIDTH = 640;
const RESIZE_GUTTER_WIDTH = vars.space.sp24;
const OUTSIDE_STRIP_WIDTH = vars.space.sp12;

const PREVIEW_CARD_CONTAINER = 'example-preview-card';
const previewCardResizable = `${PREVIEW_CARD_CONTAINER} (inline-size >= ${MIN_RESIZABLE_CARD_WIDTH}px)`;

// Name the card container so shell queries keep measuring the root.
export const previewGroup = style({
	'@layer': {
		components: {
			containerName: PREVIEW_CARD_CONTAINER,
			containerType: 'inline-size',
			display: 'flex',
			isolation: 'isolate',
			overflow: 'hidden',
		},
	},
});

// Inline panel styles set `min-width: 0`. Keep the outside strip open.
globalStyle(`${previewGroup} > [data-panel]:last-child`, {
	'@layer': {
		components: {
			'@media': {
				[docsTabletMinWidthMedia]: {
					'@container': {
						[previewCardResizable]: {
							minInlineSize: `${OUTSIDE_STRIP_WIDTH} !important`,
						},
					},
				},
			},
		},
	},
});

export const previewCanvas = style({
	'@layer': {
		components: {
			containerType: 'inline-size',
			'@media': {
				[docsTabletMinWidthMedia]: {
					'@container': {
						[previewCardResizable]: {
							paddingInlineEnd: RESIZE_GUTTER_WIDTH,
						},
					},
				},
			},
		},
	},
});

export const previewOutside = style({
	'@layer': {
		components: {
			backgroundColor: `color-mix(in oklab, ${vars.color.surface.subdued} 50%, transparent)`,
		},
	},
});

export const previewSeparator = style({
	'@layer': {
		components: {
			backgroundColor: vars.color.border.decorative,
			cursor: 'col-resize',
			display: 'none',
			flexShrink: 0,
			inlineSize: '1px',
			position: 'relative',
			zIndex: 10,
			'@media': {
				[docsTabletMinWidthMedia]: {
					'@container': {
						[previewCardResizable]: {
							display: 'block',
						},
					},
				},
			},
		},
	},
});

export const previewGripState = style({
	'@layer': {
		components: {
			borderColor: vars.color.border.decorative,
			boxShadow: vars.depth.resting,
			color: vars.color.text.secondary,
			pointerEvents: 'none',
			transform: 'translate(-50%, -50%)',
			transitionDuration: vars.motion.feedback.duration,
			transitionProperty: 'box-shadow, border-color',
			transitionTimingFunction: vars.motion.feedback.easing,
			selectors: {
				[`${previewSeparator}[data-separator=hover] &`]: {
					borderColor: `color-mix(in oklab, ${vars.color.text.secondary} 80%, transparent)`,
				},
				[`${previewSeparator}[data-separator=active] &`]: {
					borderColor: vars.color.text.secondary,
				},
				[`${previewSeparator}[data-separator=focus] &`]: {
					boxShadow: `0 0 0 2px ${vars.color.border.focus}`,
				},
			},
			'@media': {
				'(prefers-reduced-motion: reduce)': {
					transition: 'none',
				},
			},
		},
	},
});

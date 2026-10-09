import { vars } from '@luke-ui/react/theme';
import { globalStyle, style } from '@vanilla-extract/css';
import { DESKTOP_MEDIA_QUERY } from './playground/use-is-desktop.js';

export const MIN_RESIZABLE_CARD_WIDTH = 640;
const RESIZE_GUTTER_WIDTH = vars.space.sp24;
const OUTSIDE_STRIP_WIDTH = vars.space.sp12;

const PREVIEW_CARD_CONTAINER = 'example-preview-card';
const previewCardResizable = `${PREVIEW_CARD_CONTAINER} (inline-size >= ${MIN_RESIZABLE_CARD_WIDTH}px)`;

// Name the card container so shell queries keep measuring the root.
export const previewGroup = style({
	'@layer': {
		recipes: {
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
		recipes: {
			'@media': {
				[DESKTOP_MEDIA_QUERY]: {
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
		recipes: {
			containerType: 'inline-size',
			'@media': {
				[DESKTOP_MEDIA_QUERY]: {
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
		recipes: {
			backgroundColor: `color-mix(in oklab, ${vars.color.surface.subdued} 50%, transparent)`,
		},
	},
});

export const previewSeparator = style({
	'@layer': {
		recipes: {
			backgroundColor: vars.color.border.decorative,
			cursor: 'col-resize',
			display: 'none',
			flexShrink: 0,
			inlineSize: '1px',
			position: 'relative',
			zIndex: 10,
			'@media': {
				[DESKTOP_MEDIA_QUERY]: {
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
		recipes: {
			borderColor: vars.color.border.decorative,
			boxShadow: vars.depth.resting,
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
		},
	},
});

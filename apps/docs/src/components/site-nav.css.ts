import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';
import { docsTabletMinInlineSize } from '../lib/docs-container-queries.js';
import { overlayMotion } from '../lib/overlay-motion.js';
import { SITE_HEADER_BLOCK_SIZE } from './site-header-size.js';

/** Inline padding of the header row. Docs panels that sit beside the header edge reuse it. */
export const siteGutter = {
	initial: vars.space['16'],
	tablet: vars.space['24'],
} as const;

// The header sits on the page chrome with no border: the content panel below it carries the edge.
// Sticky on every surface that uses SiteHeader (home, playground, 404, and docs).
export const header = style({
	'@layer': {
		components: {
			alignItems: 'center',
			display: 'flex',
			flexShrink: 0,
			flexWrap: 'wrap',
			gap: vars.space['12'],
			insetBlockStart: 0,
			paddingInline: siteGutter.initial,
			position: 'sticky',
			zIndex: 10,
			'@container': {
				[docsTabletMinInlineSize]: {
					columnGap: vars.space['24'],
					paddingInline: siteGutter.tablet,
				},
			},
		},
	},
});

export const wordmark = style({
	'@layer': {
		components: {
			alignItems: 'center',
			color: vars.color.text.primary,
			display: 'flex',
			fontSize: vars.font.label.fontSize,
			fontWeight: vars.font.weight.emphasis,
			minBlockSize: SITE_HEADER_BLOCK_SIZE,
			textDecoration: 'none',
			whiteSpace: 'nowrap',
		},
	},
});

export const start = style({
	'@layer': {
		components: {
			alignItems: 'center',
			columnGap: vars.space['16'],
			display: 'flex',
		},
	},
});

// Below tablet the links take their own row under the wordmark and actions.
export const destinations = style({
	'@layer': {
		components: {
			alignItems: 'center',
			columnGap: vars.space['16'],
			display: 'flex',
			inlineSize: '100%',
			order: 1,
			paddingBlockEnd: vars.space['8'],
			'@container': {
				[docsTabletMinInlineSize]: {
					inlineSize: 'auto',
					marginInlineStart: 'auto',
					minBlockSize: SITE_HEADER_BLOCK_SIZE,
					order: 0,
					paddingBlockEnd: 0,
				},
			},
		},
	},
});

export const destination = style({
	'@layer': {
		components: {
			alignItems: 'center',
			color: vars.color.text.secondary,
			display: 'inline-grid',
			fontSize: vars.font.label.fontSize,
			textDecoration: 'none',
			transition: `color ${vars.motion.feedback.duration} ${vars.motion.feedback.easing}`,
			selectors: {
				'&:hover': {
					color: vars.color.text.primary,
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

export const activeDestination = style({
	'@layer': {
		components: {
			color: vars.color.text.primary,
			fontWeight: vars.font.weight.emphasis,
		},
	},
});

export const destinationLabel = style({
	'@layer': {
		components: {
			gridArea: '1 / 1',
		},
	},
});

// Reserve the bold label's intrinsic width before the destination becomes active.
export const destinationWidth = style([
	destinationLabel,
	{
		'@layer': {
			components: {
				fontWeight: vars.font.weight.emphasis,
				visibility: 'hidden',
			},
		},
	},
]);

export const actions = style({
	'@layer': {
		components: {
			alignItems: 'center',
			columnGap: vars.space['8'],
			display: 'flex',
			flexShrink: 0,
			marginInlineStart: 'auto',
			minBlockSize: SITE_HEADER_BLOCK_SIZE,
			'@container': {
				[docsTabletMinInlineSize]: {
					marginInlineStart: 0,
				},
			},
		},
	},
});

export const appearancePopover = style({
	'@layer': {
		components: {
			// The popover opens below its trigger, so it settles down from just above.
			...overlayMotion({
				hidden: { opacity: 0, translate: '0 -4px' },
				properties: ['opacity', 'translate'],
				rule: {
					backgroundColor: vars.color.surface.overlay,
					border: `1px solid ${vars.color.border.decorative}`,
					borderRadius: vars.radius.surface,
					boxShadow: vars.depth.floating,
					maxInlineSize: 'calc(100vw - 2rem)',
					padding: vars.space['8'],
					translate: 'none',
					zIndex: 50,
				},
			}),
		},
	},
});

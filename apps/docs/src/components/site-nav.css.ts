import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';
import {
	docsMaxInlineSize,
	docsMinInlineSize,
	docsSidebarMaxInlineSize,
	docsSidebarMinInlineSize,
	docsTabletMaxInlineSize,
	docsTabletMinInlineSize,
} from '../lib/docs-container-queries.js';
import { SITE_HEADER_BLOCK_SIZE } from './site-header-size.js';

export const header = style({
	'@layer': {
		recipes: {
			alignItems: 'center',
			backgroundColor: vars.color.surface.base,
			borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
			display: 'flex',
			flexShrink: 0,
			flexWrap: 'wrap',
			gap: vars.space.sp12,
			paddingInline: vars.space.sp16,
			'@container': {
				[docsTabletMinInlineSize]: {
					columnGap: vars.space.sp16,
					paddingInline: vars.space.sp24,
				},
			},
		},
	},
});

export const wordmark = style({
	'@layer': {
		recipes: {
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

export const destinations = style({
	'@layer': {
		recipes: {
			alignItems: 'center',
			columnGap: vars.space.sp16,
			display: 'flex',
			inlineSize: '100%',
			order: 1,
			paddingBlockEnd: vars.space.sp8,
			'@container': {
				[docsTabletMinInlineSize]: {
					inlineSize: 'auto',
					minBlockSize: SITE_HEADER_BLOCK_SIZE,
					order: 0,
					paddingBlockEnd: 0,
				},
			},
		},
	},
});

export const destinationsWithSidebar = style({
	'@layer': {
		recipes: {
			'@container': {
				[docsSidebarMaxInlineSize]: {
					display: 'none',
				},
			},
		},
	},
});

export const destination = style({
	'@layer': {
		recipes: {
			alignItems: 'center',
			color: vars.color.text.secondary,
			display: 'inline-flex',
			fontSize: vars.font.label.fontSize,
			textDecoration: 'none',
			transition: `color ${vars.motion.duration.feedback} ${vars.motion.easing.standard}`,
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
		recipes: {
			color: vars.color.text.primary,
			fontWeight: vars.font.weight.emphasis,
		},
	},
});

export const actions = style({
	'@layer': {
		recipes: {
			alignItems: 'center',
			columnGap: vars.space.sp8,
			display: 'flex',
			flexShrink: 0,
			marginInlineStart: 'auto',
			minBlockSize: SITE_HEADER_BLOCK_SIZE,
		},
	},
});

/** Min width where the labelled wide search fits beside destination links on one header row. */
const WIDE_SEARCH_MIN_WIDTH_PX = 840;

export const wideSearch = style({
	'@layer': {
		recipes: {
			inlineSize: '10rem',
			'@container': {
				[docsMaxInlineSize(WIDE_SEARCH_MIN_WIDTH_PX)]: {
					display: 'none',
				},
				[docsSidebarMinInlineSize]: {
					inlineSize: '14rem',
				},
			},
		},
	},
});
export const compactSearch = style({
	'@layer': {
		recipes: {
			'@container': {
				[docsMinInlineSize(WIDE_SEARCH_MIN_WIDTH_PX)]: {
					display: 'none',
				},
			},
		},
	},
});
export const desktopTheme = style({
	'@layer': {
		recipes: {
			'@container': {
				[docsTabletMaxInlineSize]: {
					display: 'none',
				},
			},
		},
	},
});

export const mobileThemeTrigger = style({
	'@layer': {
		recipes: {
			'@container': {
				[docsTabletMinInlineSize]: {
					display: 'none',
				},
			},
		},
	},
});

// Same overlay roles as the combobox popover and docs search. The package helpers are private.
const popoverEnter = `opacity ${vars.motion.duration.enter} ${vars.motion.easing.standard}, translate ${vars.motion.duration.enter} ${vars.motion.easing.standard}`;
const popoverExit = `opacity ${vars.motion.duration.exit} ${vars.motion.easing.exit}, translate ${vars.motion.duration.exit} ${vars.motion.easing.exit}`;

// The popover opens below its trigger, so it settles down from just above.
const popoverOffset = '0 -4px';

export const appearancePopover = style({
	'@layer': {
		recipes: {
			backgroundColor: vars.color.surface.overlay,
			border: `1px solid ${vars.color.border.decorative}`,
			borderRadius: vars.radius.surface,
			boxShadow: vars.depth.floating,
			maxInlineSize: 'calc(100vw - 2rem)',
			padding: vars.space.sp8,
			transition: popoverEnter,
			translate: 'none',
			zIndex: 50,
			selectors: {
				'&[data-entering]': {
					opacity: 0,
					translate: popoverOffset,
				},
				'&[data-exiting]': {
					opacity: 0,
					transition: popoverExit,
					translate: popoverOffset,
				},
			},
			'@media': {
				// Reduced motion must repeat `none` on each selector, or the state rules win.
				'(prefers-reduced-motion: reduce)': {
					transition: 'none',
					selectors: {
						'&[data-entering]': { opacity: 1, transition: 'none', translate: 'none' },
						'&[data-exiting]': { opacity: 1, transition: 'none', translate: 'none' },
					},
				},
			},
		},
	},
});

export const appearanceDialog = style({
	'@layer': {
		recipes: {},
	},
});

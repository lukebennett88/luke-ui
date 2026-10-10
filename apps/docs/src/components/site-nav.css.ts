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
		components: {
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

export const destinations = style({
	'@layer': {
		components: {
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
		components: {
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
		components: {
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
		components: {
			color: vars.color.text.primary,
			fontWeight: vars.font.weight.emphasis,
		},
	},
});

export const actions = style({
	'@layer': {
		components: {
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
		components: {
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
		components: {
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
		components: {
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
		components: {
			'@container': {
				[docsTabletMinInlineSize]: {
					display: 'none',
				},
			},
		},
	},
});

export const appearancePopover = style({
	'@layer': {
		components: {
			backgroundColor: vars.color.surface.overlay,
			border: `1px solid ${vars.color.border.decorative}`,
			borderRadius: vars.radius.surface,
			boxShadow: vars.depth.floating,
			maxInlineSize: 'calc(100vw - 2rem)',
			padding: vars.space.sp8,
			zIndex: 50,
		},
	},
});
export const appearanceDialog = style({
	'@layer': {
		components: {},
	},
});

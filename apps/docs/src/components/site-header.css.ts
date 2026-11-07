import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';
import {
	docsSidebarMinInlineSize,
	SITE_HEADER_CONTAINER,
	siteHeaderDesktopMinInlineSize,
} from '../lib/docs-container-queries.js';
import { overlayMotion } from '../lib/overlay-motion.js';
import { SITE_HEADER_BLOCK_SIZE } from './site-header-size.js';

/** Inline padding of the header row. Panels that sit beside the header edge reuse it. */
export const siteGutter = {
	compact: vars.space['16'],
	desktop: vars.space['24'],
} as const;

/**
 * The gap between the wordmark and the control after it, and between the sidebar toggle and the
 * links. It is wider than the links' own gap so the wordmark reads as the home link, not a fourth
 * destination.
 */
const START_GAP = vars.space['24'];

// The header is the `site-header` container. It sits on the page chrome with no border: the content
// panel below it carries the edge. A container measures its content box, so the padding lives on
// the inner row. Sticky on every surface that uses the header.
export const header = style({
	'@layer': {
		components: {
			containerName: SITE_HEADER_CONTAINER,
			containerType: 'inline-size',
			flexShrink: 0,
			insetBlockStart: 0,
			position: 'sticky',
			zIndex: 10,
		},
	},
});

// One row at every width. The compact and desktop layouts differ only in which children show.
export const row = style({
	'@layer': {
		components: {
			alignItems: 'center',
			columnGap: vars.space['16'],
			display: 'flex',
			justifyContent: 'space-between',
			minBlockSize: SITE_HEADER_BLOCK_SIZE,
			paddingInline: siteGutter.compact,
			'@container': {
				[siteHeaderDesktopMinInlineSize]: {
					paddingInline: siteGutter.desktop,
				},
			},
		},
	},
});

export const start = style({
	'@layer': {
		components: {
			alignItems: 'center',
			columnGap: START_GAP,
			display: 'flex',
			minInlineSize: 0,
		},
	},
});

export const wordmark = style({
	'@layer': {
		components: {
			alignItems: 'center',
			color: vars.color.foreground.primary,
			display: 'flex',
			fontSize: vars.font.label.fontSize,
			fontWeight: vars.font.weight.emphasis,
			minBlockSize: SITE_HEADER_BLOCK_SIZE,
			textDecoration: 'none',
			whiteSpace: 'nowrap',
		},
	},
});

// Shown only while the sidebar is. Its own flow position follows the wordmark, so the gap is the
// start group's column gap. The shell is as wide as the header and its threshold is the larger one,
// so a visible sidebar always comes with the desktop row (a test checks the order).
export const sidebarToggle = style({
	'@layer': {
		components: {
			display: 'none',
			'@container': {
				[docsSidebarMinInlineSize]: {
					display: 'inline-flex',
				},
			},
		},
	},
});

// The panel's divider sits at the inline start, so the glyph mirrors in RTL.
export const sidebarIcon = style({
	'@layer': {
		components: {
			selectors: {
				'&:dir(rtl)': {
					transform: 'scaleX(-1)',
				},
			},
		},
	},
});

export const destinations = style({
	'@layer': {
		components: {
			alignItems: 'center',
			columnGap: vars.space['16'],
			display: 'none',
			'@container': {
				[siteHeaderDesktopMinInlineSize]: {
					display: 'flex',
				},
			},
		},
	},
});

export const destination = style({
	'@layer': {
		components: {
			alignItems: 'center',
			color: vars.color.foreground.secondary,
			display: 'inline-grid',
			fontSize: vars.font.label.fontSize,
			minBlockSize: '2.5rem',
			textDecoration: 'none',
			transition: `color ${vars.motion.feedback.duration} ${vars.motion.feedback.easing}`,
			selectors: {
				'&:hover': {
					color: vars.color.foreground.primary,
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
			color: vars.color.foreground.primary,
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
		},
	},
});

// GitHub is a header control on desktop. The compact row leaves it to the drawer.
export const desktopOnly = style({
	'@layer': {
		components: {
			display: 'none',
			'@container': {
				[siteHeaderDesktopMinInlineSize]: {
					display: 'inline-flex',
				},
			},
		},
	},
});

// Menu shows whenever the compact row does.
export const menuTrigger = style({
	'@layer': {
		components: {
			'@container': {
				[siteHeaderDesktopMinInlineSize]: {
					display: 'none',
				},
			},
		},
	},
});

// On a page with a sidebar, Menu shows until the sidebar does. That covers the compact row and the
// middle state, where the header has room but the shell does not and the drawer holds only the tree.
export const menuTriggerWithSidebar = style({
	'@layer': {
		components: {
			'@container': {
				[docsSidebarMinInlineSize]: {
					display: 'none',
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
					backgroundColor: vars.color.background.surface.raised,
					border: `1px solid ${vars.color.border.decorative}`,
					borderRadius: vars.radius.surface,
					boxShadow: vars.shadow.floating,
					maxInlineSize: 'calc(100vw - 2rem)',
					translate: 'none',
					zIndex: 50,
				},
			}),
		},
	},
});

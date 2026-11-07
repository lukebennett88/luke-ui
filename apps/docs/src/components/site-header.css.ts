import { vars } from '@luke-ui/react/theme';
import { globalStyle, keyframes, style } from '@vanilla-extract/css';
import {
	docsSidebarMinInlineSize,
	SITE_HEADER_CONTAINER,
	siteHeaderDesktopMinInlineSize,
} from '../lib/docs-container-queries.js';
import { overlayMotion } from '../lib/overlay-motion.js';
import { ROUTE_VIEW_TRANSITION_TYPE } from '../lib/route-view-transition.js';
import { siteDestinations } from '../lib/site-destinations.js';
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

/*
 * Route-change motion. The router runs each navigation in a View Transition of type `route` (see
 * `lib/route-view-transition.ts`). Home and the docs render separate headers, so each item gets a
 * stable `view-transition-name` for the length of that transition only. The browser pairs the old
 * and new item, then moves it between its two positions. Names live under the type selector, so
 * the search morph and every other transition see no header names. Only header items are named,
 * and each name is unique: a header renders once, and the compact and desktop layouts hide the
 * other layout's items with `display: none`, which holds no name.
 *
 * An item moves on the enter treatment (250ms). The sidebar toggle has no twin on the other page,
 * so it scales and fades in on the enter treatment and out on the faster exit one. Reduced motion
 * never starts the transition (the router option reads it), so those pages swap instantly.
 */
const ROUTE_TRANSITION = `:root:active-view-transition-type(${ROUTE_VIEW_TRANSITION_TYPE})`;
const MOVE_CLASS = 'site-header-move';
const TOGGLE_CLASS = 'site-header-toggle';

function transitionName(name: string, viewTransitionClass = MOVE_CLASS) {
	return style({
		'@layer': {
			components: {
				selectors: {
					[`${ROUTE_TRANSITION} &`]: {
						viewTransitionClass,
						viewTransitionName: `site-header-${name}`,
					},
				},
			},
		},
	});
}

/** Combine with an item's own class. Destinations are keyed by label. */
export const transitionItem: Record<string, string> = {
	github: transitionName('github'),
	menu: transitionName('menu'),
	search: transitionName('search'),
	sidebarToggle: transitionName('sidebar-toggle', TOGGLE_CLASS),
	theme: transitionName('theme'),
	wordmark: transitionName('wordmark'),
	...Object.fromEntries(
		siteDestinations.map(({ label }) => [label, transitionName(`link-${label.toLowerCase()}`)]),
	),
};

const toggleEnter = keyframes({ from: { opacity: 0, transform: 'scale(0.8)' } });
const toggleExit = keyframes({ to: { opacity: 0, transform: 'scale(0.8)' } });

// The page content swaps at once: the old root snapshot is hidden and the new one is not faded in,
// so there is no cross-fade over the page. Without root animations the transition lasts exactly as
// long as the header items' motion.
globalStyle(`${ROUTE_TRANSITION}::view-transition-old(root)`, { display: 'none' });
globalStyle(`${ROUTE_TRANSITION}::view-transition-new(root)`, { animation: 'none' });
globalStyle(`${ROUTE_TRANSITION}::view-transition-group(root)`, { animation: 'none' });

globalStyle(
	`::view-transition-group(.${MOVE_CLASS}), ::view-transition-old(.${MOVE_CLASS}), ::view-transition-new(.${MOVE_CLASS})`,
	{
		animationDuration: vars.motion.enter.duration,
		animationTimingFunction: vars.motion.enter.easing,
	},
);

globalStyle(`::view-transition-new(.${TOGGLE_CLASS})`, {
	animationDuration: vars.motion.enter.duration,
	animationName: toggleEnter,
	animationTimingFunction: vars.motion.enter.easing,
});

globalStyle(`::view-transition-old(.${TOGGLE_CLASS})`, {
	animationDuration: vars.motion.exit.duration,
	animationName: toggleExit,
	animationTimingFunction: vars.motion.exit.easing,
});

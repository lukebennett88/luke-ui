import { vars } from '@luke-ui/react/theme';
import { globalStyle, keyframes, style } from '@vanilla-extract/css';
import { overlayMotion } from '../lib/overlay-motion.js';
import { ROUTE_VIEW_TRANSITION_TYPE } from '../lib/route-view-transition.js';
import {
	docsSidebarMinInlineSize,
	SITE_HEADER_CONTAINER,
	siteHeaderDesktopMinInlineSize,
} from './docs-container-queries.js';
import { siteDestinations } from './site-destinations.js';
import { SITE_HEADER_BLOCK_SIZE } from './site-header-size.js';

/** The header row's inline padding. Panels below it align to the same gutter. */
export const siteGutter = {
	compact: vars.space['16'],
	desktop: vars.space['24'],
} as const;

/** Wider than the links' own gap, so the wordmark does not read as a fourth destination. */
const START_GAP = vars.space['24'];

// A container measures its content box, so the padding lives on the inner row.
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

// Shown with the sidebar. The sidebar threshold is above the header's, so this only appears in the
// desktop row.
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

// On a page with a sidebar, Menu shows until the sidebar does.
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
 * Route-change motion. Each page renders its own header, so header items carry a
 * `view-transition-name` during a `route` transition only, and the browser moves each item between
 * its old and new position. Names must be unique: the layout an item is hidden in uses
 * `display: none`, which holds no name. The sidebar toggle has no twin on pages without a sidebar,
 * so it scales and fades instead.
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

export const transitionItem = {
	github: transitionName('github'),
	menu: transitionName('menu'),
	search: transitionName('search'),
	sidebarToggle: transitionName('sidebar-toggle', TOGGLE_CLASS),
	theme: transitionName('theme'),
	wordmark: transitionName('wordmark'),
};

/** Keyed by destination label. */
export const destinationTransition: Record<string, string> = Object.fromEntries(
	siteDestinations.map(({ label }) => [label, transitionName(`link-${label.toLowerCase()}`)]),
);

const toggleEnter = keyframes({ from: { opacity: 0, transform: 'scale(0.8)' } });
const toggleExit = keyframes({ to: { opacity: 0, transform: 'scale(0.8)' } });

// The page itself swaps without a cross-fade.
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

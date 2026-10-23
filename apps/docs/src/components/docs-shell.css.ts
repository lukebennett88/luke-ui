import { vars } from '@luke-ui/react/theme';
import { createVar, style } from '@vanilla-extract/css';
import {
	docsSidebarMaxInlineSize,
	docsSidebarMinInlineSize,
	docsTocMinInlineSize,
} from '../lib/docs-container-queries.js';
import { overlayMotion } from '../lib/overlay-motion.js';
import {
	SIDEBAR_COLLAPSED_SELECTOR,
	SIDEBAR_EXPANDED_SELECTOR,
} from '../lib/sidebar-prefs-shared.js';
import { SITE_HEADER_BLOCK_SIZE } from './site-header-size.js';
import { siteGutter } from './site-nav.css.js';

/** Narrow like a docs index. The sidebar footer stacks the theme controls to fit. */
const SIDEBAR_INLINE_SIZE = '17rem';
/** The inline padding inside the sidebar, which the header's start group lines up with. */
const SIDEBAR_PADDING_INLINE = vars.space['16'];

const whenCollapsed = `${SIDEBAR_COLLAPSED_SELECTOR} &`;
const whenExpanded = `${SIDEBAR_EXPANDED_SELECTOR} &`;

// The header and sidebar sit on the page chrome. A collapsed sidebar leaves a gutter as wide as the
// header's inline padding, so the panel's start edge lines up with the wordmark.
export const shell = style({
	'@layer': {
		components: {
			display: 'grid',
			gridTemplateAreas: '"header" "panel"',
			gridTemplateColumns: 'minmax(0, 1fr)',
			gridTemplateRows: 'auto minmax(0, 1fr)',
			minBlockSize: '100dvh',
			minInlineSize: 0,
			'@container': {
				[docsSidebarMinInlineSize]: {
					gridTemplateAreas: '"header header" "sidebar panel"',
					gridTemplateColumns: `${SIDEBAR_INLINE_SIZE} minmax(0, 1fr)`,
					selectors: {
						[whenCollapsed]: {
							gridTemplateColumns: `${siteGutter.tablet} minmax(0, 1fr)`,
						},
					},
				},
			},
		},
	},
});

// Below the sidebar layout the panel spans the viewport with rounded top corners. Beside the sidebar
// its start corners stay rounded and it runs flush to the inline-end and bottom edges. `clip` trims
// the table of contents bar to the corners without making a scroll container, so sticky descendants
// still stick to the viewport.
export const panel = style({
	'@layer': {
		components: {
			borderStartEndRadius: vars.radius.surface,
			borderStartStartRadius: vars.radius.surface,
			display: 'grid',
			gridArea: 'panel',
			gridTemplateAreas: '"main"',
			gridTemplateColumns: 'minmax(0, 1fr)',
			minInlineSize: 0,
			overflow: 'clip',
			'@container': {
				[docsSidebarMinInlineSize]: {
					borderEndStartRadius: vars.radius.surface,
					borderStartEndRadius: 0,
				},
				[docsTocMinInlineSize]: {
					gridTemplateAreas: '"main toc"',
					gridTemplateColumns: 'minmax(0, 1fr) 16rem',
				},
			},
		},
	},
});

export const header = style({
	'@layer': {
		components: {
			gridArea: 'header',
			insetBlockStart: 0,
			position: 'sticky',
			zIndex: 10,
		},
	},
});

// In the sidebar layout the group spans the sidebar column, so the toggle ends where the sidebar's
// search field ends.
export const headerStart = style({
	'@layer': {
		components: {
			alignItems: 'center',
			columnGap: vars.space['8'],
			display: 'flex',
			'@container': {
				[docsSidebarMinInlineSize]: {
					columnGap: vars.space['4'],
					minInlineSize: `calc(${SIDEBAR_INLINE_SIZE} - ${siteGutter.tablet} - ${SIDEBAR_PADDING_INLINE})`,
				},
			},
		},
	},
});

export const sidebarToggle = style({
	'@layer': {
		components: {
			marginInlineStart: 'auto',
			'@container': {
				[docsSidebarMaxInlineSize]: {
					display: 'none',
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

// The sidebar holds the search field while it shows.
export const headerSearch = style({
	'@layer': {
		components: {
			display: 'flex',
			'@container': {
				[docsSidebarMinInlineSize]: {
					selectors: {
						[whenExpanded]: {
							display: 'none',
						},
					},
				},
			},
		},
	},
});

export const headerDestinations = style({
	'@layer': {
		components: {
			display: 'none',
			'@container': {
				[docsSidebarMinInlineSize]: {
					alignItems: 'center',
					columnGap: vars.space['16'],
					display: 'flex',
					marginInlineStart: 'auto',
					minBlockSize: SITE_HEADER_BLOCK_SIZE,
				},
			},
		},
	},
});

export const headerActions = style({
	'@layer': {
		components: {
			alignItems: 'center',
			columnGap: vars.space['8'],
			display: 'flex',
			flexShrink: 0,
			marginInlineStart: 'auto',
			minBlockSize: SITE_HEADER_BLOCK_SIZE,
			'@container': {
				[docsSidebarMinInlineSize]: {
					marginInlineStart: 0,
				},
			},
		},
	},
});

// The sidebar footer holds the theme controls while it shows, and the drawer below the sidebar
// layout.
export const headerTheme = style({
	'@layer': {
		components: {
			selectors: {
				[whenExpanded]: {
					display: 'none',
				},
			},
			'@container': {
				[docsSidebarMaxInlineSize]: {
					display: 'none',
				},
			},
		},
	},
});

export const mobileTrigger = style({
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

// Search at the top, the scrolling nav in the middle, and the theme controls pinned to the bottom.
export const sidebar = style({
	'@layer': {
		components: {
			alignSelf: 'start',
			blockSize: `calc(100dvh - ${SITE_HEADER_BLOCK_SIZE})`,
			display: 'none',
			flexDirection: 'column',
			gridArea: 'sidebar',
			insetBlockStart: SITE_HEADER_BLOCK_SIZE,
			position: 'sticky',
			'@container': {
				[docsSidebarMinInlineSize]: {
					display: 'flex',
					selectors: {
						[whenCollapsed]: {
							display: 'none',
						},
					},
				},
			},
		},
	},
});

// The identity toggle sits above the colour-mode group so both fit the narrow sidebar.
export const sidebarThemeControls = style({
	'@layer': {
		components: {
			alignItems: 'flex-start',
			flexDirection: 'column',
			gap: vars.space['8'],
		},
	},
});

export const sidebarNav = style({
	'@layer': {
		components: {
			flex: '1 1 auto',
			minBlockSize: 0,
			overflowY: 'auto',
			overscrollBehavior: 'contain',
		},
	},
});

/** Hover, current, and focus styles for docs nav links. Layout lives on Box. */
export const navLink = style({
	'@layer': {
		components: {
			color: vars.color.text.secondary,
			fontSize: vars.font.label.fontSize,
			lineHeight: vars.font.label.lineHeight,
			textDecoration: 'none',
			selectors: {
				'&:hover': {
					backgroundColor: vars.color.background.neutral.subtle.hover,
					color: vars.color.text.primary,
				},
				// Inset the global ring so the scrolling sidebar doesn't clip it.
				'&:focus-visible': {
					outlineOffset: '-2px',
				},
				// The sidebar sits on the subdued chrome, where the resting accent fill barely differs
				// from the surface in light mode. The pressed step stays one step past the hover fill.
				'&[aria-current="page"]': {
					backgroundColor: vars.color.background.accent.subtle.pressed,
					color: vars.color.text.primary,
				},
			},
		},
	},
});

// Off-screen toward the inline-end edge. Physical `translate` needs the sign flipped in RTL.
const drawerOffset = createVar();

// The scrim is a pseudo-element because the panel is the overlay's child. Fading the overlay itself
// would multiply into the panel's opacity. The overlay element has no transition of its own, so
// React Aria keeps it mounted during exit only because the panel's `translate` exit lasts as long
// as the scrim's fade. Its exit detection reads `getAnimations()` on the overlay and modal elements,
// not on pseudo-elements.
export const drawerOverlay = style({
	'@layer': {
		components: {
			...overlayMotion({
				hidden: { opacity: 0 },
				properties: ['opacity'],
				pseudo: '::before',
				rule: {
					inset: 0,
					position: 'fixed',
					zIndex: 100,
					selectors: {
						'&[data-exiting]': { pointerEvents: 'none' },
						'&::before': {
							backgroundColor: vars.color.overlay.backdrop,
							content: '""',
							inset: 0,
							position: 'absolute',
						},
					},
				},
			}),
		},
	},
});

export const drawerModal = style({
	'@layer': {
		components: {
			...overlayMotion({
				hidden: { translate: `${drawerOffset} 0` },
				properties: ['translate'],
				rule: {
					backgroundColor: vars.color.surface.overlay,
					blockSize: '100%',
					boxShadow: vars.depth.overlay,
					inlineSize: 'min(22rem, 90vw)',
					marginInlineStart: 'auto',
					position: 'relative',
					translate: 'none',
					vars: { [drawerOffset]: '100%' },
					selectors: {
						'&:dir(rtl)': {
							vars: { [drawerOffset]: '-100%' },
						},
					},
				},
			}),
		},
	},
});

export const drawerDialog = style({
	'@layer': {
		components: {
			blockSize: '100%',
			overflowY: 'auto',
		},
	},
});

import { vars } from '@luke-ui/react/theme';
import { interactionState } from '@luke-ui/react/utils';
import { createVar, style } from '@vanilla-extract/css';
import {
	DOCS_SHELL_CONTAINER,
	docsSidebarMinInlineSize,
	docsTocMinInlineSize,
} from '../lib/docs-container-queries.js';
import { SIDEBAR_COLLAPSED_SELECTOR } from '../lib/sidebar-prefs-shared.js';
import { SITE_HEADER_BLOCK_SIZE } from './site-header-size.js';
import { siteGutter } from './site-header.css.js';

/** Narrow like a docs index. */
const SIDEBAR_INLINE_SIZE = '17rem';
const SIDEBAR_MOTION = '300ms ease-in-out';
const sidebarOffset = createVar();

const whenCollapsed = `${SIDEBAR_COLLAPSED_SELECTOR} &`;

// The `docs-shell` container. A container cannot query itself, so the grid below is its child. The
// sidebar and the header's Menu button ask this container whether the sidebar shows.
export const shellContainer = style({
	'@layer': {
		components: {
			containerName: DOCS_SHELL_CONTAINER,
			containerType: 'inline-size',
		},
	},
});

// The header and sidebar sit on the page chrome. A collapsed sidebar leaves a gutter as wide as the
// desktop header's inline padding, so the panel's start edge lines up with the wordmark.
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
					transition: `grid-template-columns ${SIDEBAR_MOTION}`,
					selectors: {
						[whenCollapsed]: {
							gridTemplateColumns: `${siteGutter.desktop} minmax(0, 1fr)`,
						},
					},
					'@media': {
						'(prefers-reduced-motion: reduce)': { transition: 'none' },
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

// Sticky lives on the shared SiteHeader (`site-header.css.ts`); this only places the bar in the shell
// grid.
export const header = style({
	'@layer': {
		components: {
			gridArea: 'header',
		},
	},
});

// The sidebar holds the scrolling docs navigation.
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
					inlineSize: SIDEBAR_INLINE_SIZE,
					opacity: 1,
					translate: '0 0',
					visibility: 'visible',
					transition: `translate ${SIDEBAR_MOTION}, opacity ${SIDEBAR_MOTION}, visibility 0s`,
					vars: { [sidebarOffset]: '-100%' },
					selectors: {
						'&:dir(rtl)': { vars: { [sidebarOffset]: '100%' } },
						[whenCollapsed]: {
							opacity: 0,
							translate: `${sidebarOffset} 0`,
							visibility: 'hidden',
							transition: `translate ${SIDEBAR_MOTION}, opacity ${SIDEBAR_MOTION}, visibility 0s 300ms`,
						},
					},
					'@media': {
						'(prefers-reduced-motion: reduce)': {
							translate: 'none',
							transition: 'opacity 100ms ease-in-out, visibility 0s',
							selectors: {
								[whenCollapsed]: {
									translate: 'none',
									transition: 'opacity 100ms ease-in-out, visibility 0s 100ms',
								},
							},
						},
					},
				},
			},
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

/**
 * The minimum block size of a nav link. The sidebar leaves it unset and keeps the compact row. The
 * drawer sets it on its body so touch targets reach 2.75rem.
 */
export const navLinkMinBlockSize = createVar();

/** Hover, current, and focus styles for docs nav links. Layout lives on Box. */
export const navLink = style({
	'@layer': {
		components: {
			color: vars.color.foreground.secondary,
			fontSize: vars.font.label.fontSize,
			lineHeight: vars.font.label.lineHeight,
			textDecoration: 'none',
			selectors: {
				'&:hover': {
					...interactionState('hover'),
					color: vars.color.foreground.primary,
				},
				// Inset the global ring so the scrolling sidebar doesn't clip it.
				'&:focus-visible': {
					outlineOffset: '-2px',
				},
				// The sidebar sits on the subdued chrome, where the resting accent fill barely differs
				// from the surface in light mode. The pressed step stays one step past the hover fill.
				'&[aria-current="page"]': {
					...interactionState('pressed'),
					color: vars.color.foreground.primary,
				},
			},
		},
	},
});

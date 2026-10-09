import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';
import { docsSidebarMinInlineSize, docsTocMinInlineSize } from '../lib/docs-container-queries.js';
import { SITE_HEADER_BLOCK_SIZE } from './site-header-size.js';

export const shell = style({
	'@layer': {
		recipes: {
			// `DocsArticle` places the article in `main` and the desktop table of contents in `toc`.
			backgroundColor: vars.color.surface.base,
			display: 'grid',
			gridTemplateAreas: '"header" "main"',
			gridTemplateColumns: 'minmax(0, 1fr)',
			gridTemplateRows: 'auto minmax(0, 1fr)',
			minBlockSize: '100dvh',
			minInlineSize: 0,
			'@container': {
				[docsSidebarMinInlineSize]: {
					gridTemplateAreas: '"header header" "sidebar main"',
					gridTemplateColumns: '16rem minmax(0, 1fr)',
				},
				[docsTocMinInlineSize]: {
					gridTemplateAreas: '"header header header" "sidebar main toc"',
					gridTemplateColumns: '16rem minmax(0, 1fr) 16rem',
				},
			},
		},
	},
});

export const header = style({
	'@layer': {
		recipes: {
			gridArea: 'header',
			insetBlockStart: 0,
			position: 'sticky',
			zIndex: 10,
		},
	},
});

export const sidebar = style({
	'@layer': {
		recipes: {
			backgroundColor: vars.color.surface.base,
			borderInlineEnd: `1px solid ${vars.color.border.decorative}`,
			display: 'none',
			gridArea: 'sidebar',
			insetBlockStart: SITE_HEADER_BLOCK_SIZE,
			maxBlockSize: `calc(100dvh - ${SITE_HEADER_BLOCK_SIZE})`,
			overflow: 'auto',
			position: 'sticky',
			'@container': {
				[docsSidebarMinInlineSize]: {
					display: 'block',
				},
			},
		},
	},
});

/** Hover, current, and focus styles for docs nav links. Layout lives on Box. */
export const navLink = style({
	'@layer': {
		recipes: {
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
				'&[aria-current="page"]': {
					backgroundColor: vars.color.background.accent.subtle.rest,
					color: vars.color.text.primary,
				},
			},
		},
	},
});

export const mobileTrigger = style({
	'@layer': {
		recipes: {
			'@container': {
				[docsSidebarMinInlineSize]: {
					display: 'none',
				},
			},
		},
	},
});

export const drawerOverlay = style({
	'@layer': {
		recipes: {
			backgroundColor: vars.color.overlay.backdrop,
			inset: 0,
			position: 'fixed',
			zIndex: 100,
		},
	},
});

export const drawerModal = style({
	'@layer': {
		recipes: {
			backgroundColor: vars.color.surface.overlay,
			blockSize: '100%',
			boxShadow: vars.depth.overlay,
			inlineSize: 'min(22rem, 90vw)',
			marginInlineStart: 'auto',
		},
	},
});

export const drawerDialog = style({
	'@layer': {
		recipes: {
			blockSize: '100%',
			overflowY: 'auto',
		},
	},
});

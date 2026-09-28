import { vars } from '@luke-ui/react/theme';
import type { ComplexStyleRule } from '@vanilla-extract/css';
import { globalStyle, style } from '@vanilla-extract/css';
import { docsSidebarMinWidth } from '../lib/docs-sidebar-media.js';
import { SITE_HEADER_BLOCK_SIZE } from './site-header-size.js';

export const shell = style({
	'@layer': {
		recipes: {
			// The retained Fumadocs DocsPage TOC uses these rows to sit below the header.
			// Remove them when #673 replaces the article and TOC.
			vars: {
				'--fd-docs-row-1': '0px',
				'--fd-docs-row-2': SITE_HEADER_BLOCK_SIZE,
			},
			backgroundColor: vars.color.surface.canvas,
			display: 'grid',
			gridTemplateAreas: '"header" "toc-popover" "main"',
			gridTemplateColumns: 'minmax(0, 1fr)',
			gridTemplateRows: 'auto auto minmax(0, 1fr)',
			minBlockSize: '100dvh',
			minInlineSize: 0,
			'@media': {
				[docsSidebarMinWidth]: {
					gridTemplateAreas: '"header header" "sidebar toc-popover" "sidebar main"',
					gridTemplateColumns: '16rem minmax(0, 1fr)',
				},
				'(min-width: 1280px)': {
					gridTemplateAreas: '"header header header" "sidebar toc-popover toc" "sidebar main toc"',
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
			backgroundColor: vars.color.surface.canvas,
			borderInlineEnd: `1px solid ${vars.color.border.decorative}`,
			display: 'none',
			gridArea: 'sidebar',
			insetBlockStart: SITE_HEADER_BLOCK_SIZE,
			maxBlockSize: `calc(100dvh - ${SITE_HEADER_BLOCK_SIZE})`,
			overflow: 'auto',
			paddingBlock: vars.space.sp16,
			paddingInline: vars.space.sp16,
			position: 'sticky',
			'@media': {
				[docsSidebarMinWidth]: {
					display: 'block',
				},
			},
		},
	},
});

export const nav = style({
	'@layer': {
		recipes: {
			color: vars.color.text.primary,
			fontSize: vars.font.label.fontSize,
			lineHeight: vars.font.label.lineHeight,
		},
	},
});

export const navList = style({
	'@layer': {
		recipes: {
			display: 'grid',
			gap: vars.space.sp4,
			listStyle: 'none',
			margin: 0,
			padding: 0,
		},
	},
});

export const nestedList = style({
	'@layer': {
		recipes: {
			display: 'grid',
			gap: vars.space.sp4,
			listStyle: 'none',
			margin: 0,
			padding: 0,
		},
	},
});

const sectionLabel = {
	borderBlockStart: `1px solid ${vars.color.border.decorative}`,
	color: vars.color.text.secondary,
	fontSize: vars.font.caption.fontSize,
	fontWeight: vars.font.weight.label,
	lineHeight: vars.font.caption.lineHeight,
	marginBlockStart: vars.space.sp16,
	paddingBlockStart: vars.space.sp16,
	paddingInline: vars.space.sp8,
} as const satisfies ComplexStyleRule;

export const separator = style({
	'@layer': {
		recipes: sectionLabel,
	},
});

globalStyle(`${navList} > ${separator}:first-child`, {
	'@layer': {
		recipes: {
			borderBlockStart: 0,
			marginBlockStart: 0,
			paddingBlockStart: 0,
		},
	},
});

const navControl = {
	alignItems: 'center',
	borderRadius: vars.radius.control,
	color: vars.color.text.secondary,
	columnGap: vars.space.sp8,
	display: 'flex',
	inlineSize: '100%',
	minBlockSize: '2rem',
	paddingBlock: vars.space.sp4,
	paddingInline: vars.space.sp8,
	textAlign: 'start',
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
} as const satisfies ComplexStyleRule;

export const navLink = style({
	'@layer': {
		recipes: navControl,
	},
});

export const folderLabel = style({
	'@layer': {
		recipes: {
			...sectionLabel,
			display: 'flex',
			columnGap: vars.space.sp8,
		},
	},
});

export const mobileTrigger = style({
	'@layer': {
		recipes: {
			'@media': {
				[docsSidebarMinWidth]: {
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
			backgroundColor: vars.color.surface.canvas,
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
			display: 'flex',
			flexDirection: 'column',
			overflowY: 'auto',
			padding: vars.space.sp16,
		},
	},
});

export const drawerHeader = style({
	'@layer': {
		recipes: {
			alignItems: 'center',
			display: 'flex',
			fontWeight: vars.font.weight.heading,
			justifyContent: 'space-between',
			marginBlockEnd: vars.space.sp16,
		},
	},
});

export const drawerSiteNav = style({
	'@layer': {
		recipes: {
			borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
			display: 'grid',
			gap: vars.space.sp4,
			marginBlockEnd: vars.space.sp16,
			paddingBlockEnd: vars.space.sp16,
		},
	},
});

globalStyle(`${drawerSiteNav} a`, {
	'@layer': {
		recipes: {
			borderRadius: vars.radius.control,
			color: vars.color.text.primary,
			paddingBlock: vars.space.sp4,
			paddingInline: vars.space.sp8,
			textDecoration: 'none',
		},
	},
});

globalStyle(`${drawerSiteNav} a[aria-current="page"]`, {
	'@layer': {
		recipes: {
			backgroundColor: vars.color.background.accent.subtle.rest,
			color: vars.color.text.primary,
		},
	},
});

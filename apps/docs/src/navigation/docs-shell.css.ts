import { vars } from '@luke-ui/react/theme';
import { interactionState } from '@luke-ui/react/utils';
import { createVar, style } from '@vanilla-extract/css';
import { ARTICLE_MAX_INLINE_SIZE } from '../components/docs-article/article-size.js';
import {
	DOCS_SHELL_CONTAINER,
	docsSidebarMinInlineSize,
	docsTocMinInlineSize,
} from './docs-container-queries.js';
import { SIDEBAR_COLLAPSED_SELECTOR } from './sidebar-prefs-shared.js';
import { SITE_HEADER_BLOCK_SIZE } from './site-header-size.js';
import { siteGutter } from './site-header.css.js';

/** Narrow like a docs index. */
const SIDEBAR_INLINE_SIZE = '17rem';
const SIDEBAR_MOTION = '300ms ease-in-out';
const sidebarOffset = createVar();

/** The reading column: `ARTICLE_MAX_INLINE_SIZE` plus the article's inline padding at wide sizes. */
const ARTICLE_TRACK_INLINE_SIZE = `calc(${ARTICLE_MAX_INLINE_SIZE} + ${vars.space['32']} * 2)`;
const TOC_INLINE_SIZE = '16rem';

const whenCollapsed = `${SIDEBAR_COLLAPSED_SELECTOR} &`;

// A container cannot query itself, so the grid is its child.
export const shellContainer = style({
	'@layer': {
		components: {
			containerName: DOCS_SHELL_CONTAINER,
			containerType: 'inline-size',
		},
	},
});

// A collapsed sidebar leaves the header's gutter, so the panel lines up with the wordmark.
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

// `clip` trims the table of contents bar to the corners without making a scroll container, so
// sticky descendants still stick to the viewport.
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
				// Fixed tracks, centred together, keep the contents a set gap after the article.
				[docsTocMinInlineSize]: {
					gridTemplateAreas: '"main toc"',
					gridTemplateColumns: `minmax(0, ${ARTICLE_TRACK_INLINE_SIZE}) ${TOC_INLINE_SIZE}`,
					justifyContent: 'center',
				},
			},
		},
	},
});

export const header = style({
	'@layer': {
		components: {
			gridArea: 'header',
		},
	},
});

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

/** Nav link minimum block size. The drawer raises it to touch-target size. */
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
				// The current page uses the same accent language as the table of contents: accent text on
				// the subtle accent surface. Hover still layers its tint on top.
				'&[aria-current="page"]': {
					backgroundColor: vars.color.background.accent.subtle,
					color: vars.color.foreground.accent.rest,
					'@media': {
						// Forced colours drop the fill, so underline marks the current page instead.
						'(forced-colors: active)': {
							textDecoration: 'underline',
						},
					},
				},
			},
		},
	},
});

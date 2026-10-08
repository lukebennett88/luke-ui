import { breakpoints, vars } from '@luke-ui/react/theme';
import type { ComplexStyleRule } from '@vanilla-extract/css';
import { globalStyle, style } from '@vanilla-extract/css';
import { docsSidebarMinWidth, docsTocMinWidth } from '../../lib/docs-sidebar-media.js';
import { SITE_HEADER_BLOCK_SIZE } from '../site-header-size.js';

const tabletMinWidth = `(min-width: ${breakpoints.bp768}px)`;

/**
 * Reading measure of the article. Roughly 75 characters of body text, which still leaves room for
 * example frames and tables.
 */
const ARTICLE_MAX_INLINE_SIZE = '52rem';

/** Block size of the sticky table of contents bar, which scroll margins must clear. */
export const TOC_BAR_BLOCK_SIZE = '3rem';

export const main = style({
	'@layer': {
		recipes: {
			gridArea: 'main',
			minInlineSize: 0,
		},
	},
});

// The bar and the article share this gutter so the bar's label lines up with the article text.
const contentInlinePadding = {
	paddingInline: vars.space.sp16,
	'@media': {
		[tabletMinWidth]: {
			paddingInline: vars.space.sp24,
		},
		[docsSidebarMinWidth]: {
			paddingInline: vars.space.sp32,
		},
	},
} as const satisfies ComplexStyleRule;

export const content = style({
	'@layer': {
		recipes: {
			...contentInlinePadding,
			paddingBlock: `${vars.space.sp32} ${vars.space.sp64}`,
			'@media': {
				...contentInlinePadding['@media'],
				[tabletMinWidth]: {
					...contentInlinePadding['@media'][tabletMinWidth],
					paddingBlockEnd: vars.space.sp96,
				},
			},
		},
	},
});

// `isolation` keeps in-flow stacking inside the article, such as example resize grips, from
// painting over the sticky header. The article hugs the inline start so the gap beside the sidebar
// matches the content gutter.
export const article = style({
	'@layer': {
		recipes: {
			isolation: 'isolate',
			maxInlineSize: ARTICLE_MAX_INLINE_SIZE,
		},
	},
});

export const header = style({
	'@layer': {
		recipes: {
			marginBlockEnd: vars.space.sp48,
		},
	},
});

export const footer = style({
	'@layer': {
		recipes: {
			borderBlockStart: `1px solid ${vars.color.border.decorative}`,
			marginBlockStart: vars.space.sp64,
			paddingBlockStart: vars.space.sp32,
		},
	},
});

export const pager = style({
	'@layer': {
		recipes: {
			display: 'grid',
			gap: vars.space.sp16,
			gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 16rem), 1fr))',
		},
	},
});

export const pagerNext = style({
	'@layer': {
		recipes: {
			textAlign: 'end',
		},
	},
});

export const pagerRow = style({
	'@layer': {
		recipes: {
			alignItems: 'center',
			columnGap: vars.space.sp12,
			display: 'flex',
		},
	},
});

export const pagerRowNext = style({
	'@layer': {
		recipes: {
			flexDirection: 'row-reverse',
		},
	},
});

export const pagerText = style({
	'@layer': {
		recipes: {
			display: 'grid',
			flexGrow: 1,
			minInlineSize: 0,
		},
	},
});

// A chevron points along the inline axis, so it flips with the writing direction.
export const pagerIcon = style({
	'@layer': {
		recipes: {
			flexShrink: 0,
			selectors: {
				'&:dir(rtl)': {
					transform: 'scaleX(-1)',
				},
			},
		},
	},
});

// Sticks below the site header. The open panel overlays the article instead of pushing it down.
export const tocBar = style({
	'@layer': {
		recipes: {
			backgroundColor: vars.color.surface.canvas,
			borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
			insetBlockStart: SITE_HEADER_BLOCK_SIZE,
			position: 'sticky',
			zIndex: 5,
			'@media': {
				[docsTocMinWidth]: {
					display: 'none',
				},
			},
		},
	},
});

export const tocSummary = style({
	'@layer': {
		recipes: {
			...contentInlinePadding,
			alignItems: 'center',
			blockSize: TOC_BAR_BLOCK_SIZE,
			color: vars.color.text.primary,
			columnGap: vars.space.sp8,
			cursor: 'pointer',
			display: 'flex',
			fontSize: vars.font.label.fontSize,
			fontWeight: vars.font.weight.label,
			lineHeight: vars.font.label.lineHeight,
			listStyle: 'none',
			selectors: {
				'&::-webkit-details-marker': {
					display: 'none',
				},
			},
		},
	},
});

export const tocSummaryIcon = style({
	'@layer': {
		recipes: {
			marginInlineStart: 'auto',
			transition: `transform ${vars.motion.duration.feedback} ${vars.motion.easing.standard}`,
			'@media': {
				'(prefers-reduced-motion: reduce)': {
					transition: 'none',
				},
			},
		},
	},
});

globalStyle(`${tocBar}[open] ${tocSummaryIcon}`, {
	'@layer': {
		recipes: {
			transform: 'rotate(180deg)',
		},
	},
});

export const tocBarPanel = style({
	'@layer': {
		recipes: {
			backgroundColor: vars.color.surface.floating,
			borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
			boxShadow: vars.depth.floating,
			insetBlockStart: '100%',
			insetInline: 0,
			maxBlockSize: `min(24rem, calc(100dvh - ${SITE_HEADER_BLOCK_SIZE} - ${TOC_BAR_BLOCK_SIZE}))`,
			overflowY: 'auto',
			paddingBlock: vars.space.sp8,
			paddingInline: vars.space.sp16,
			position: 'absolute',
			'@media': {
				[tabletMinWidth]: {
					paddingInline: vars.space.sp24,
				},
			},
		},
	},
});

export const tocColumn = style({
	'@layer': {
		recipes: {
			alignSelf: 'start',
			display: 'none',
			gridArea: 'toc',
			insetBlockStart: SITE_HEADER_BLOCK_SIZE,
			maxBlockSize: `calc(100dvh - ${SITE_HEADER_BLOCK_SIZE})`,
			overflowY: 'auto',
			paddingBlock: vars.space.sp32,
			paddingInline: vars.space.sp16,
			position: 'sticky',
			'@media': {
				[docsTocMinWidth]: {
					display: 'block',
				},
			},
		},
	},
});

export const tocTitle = style({
	'@layer': {
		recipes: {
			marginBlockEnd: vars.space.sp8,
			paddingInline: vars.space.sp8,
		},
	},
});

export const tocList = style({
	'@layer': {
		recipes: {
			borderInlineStart: `1px solid ${vars.color.border.decorative}`,
			display: 'grid',
			listStyle: 'none',
			margin: 0,
			padding: 0,
		},
	},
});

export const tocLink = style({
	'@layer': {
		recipes: {
			borderInlineStart: '2px solid transparent',
			color: vars.color.text.secondary,
			display: 'block',
			fontSize: vars.font.label.fontSize,
			lineHeight: vars.font.label.lineHeight,
			marginInlineStart: '-1px',
			paddingBlock: vars.space.sp4,
			paddingInlineEnd: vars.space.sp8,
			paddingInlineStart: vars.space.sp12,
			textDecoration: 'none',
			selectors: {
				'&:hover': {
					color: vars.color.text.primary,
				},
				'&[aria-current="location"]': {
					borderInlineStartColor: vars.color.border.accent,
					color: vars.color.foreground.accent.rest,
				},
				'&[data-depth="nested"]': {
					paddingInlineStart: vars.space.sp24,
				},
				'&[data-depth="deep"]': {
					paddingInlineStart: vars.space.sp40,
				},
			},
		},
	},
});

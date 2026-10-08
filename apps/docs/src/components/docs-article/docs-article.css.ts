import { breakpoints, vars } from '@luke-ui/react/theme';
import { globalStyle, style } from '@vanilla-extract/css';
import { docsTocMinWidth } from '../../lib/docs-sidebar-media.js';
import { SITE_HEADER_BLOCK_SIZE } from '../site-header-size.js';

const tabletMinWidth = `(min-width: ${breakpoints.bp768}px)`;

/**
 * Reading measure of the article. Roughly 75 characters of body text, which still leaves room for
 * example frames and tables.
 */
const ARTICLE_MAX_INLINE_SIZE = '52rem';

export const main = style({
	'@layer': {
		recipes: {
			gridArea: 'main',
			minInlineSize: 0,
			paddingBlock: `${vars.space.sp32} ${vars.space.sp64}`,
			paddingInline: vars.space.sp16,
			'@media': {
				[tabletMinWidth]: {
					paddingBlock: `${vars.space.sp48} ${vars.space.sp96}`,
					paddingInline: vars.space.sp32,
				},
			},
		},
	},
});

// `isolation` keeps in-flow stacking inside the article, such as example resize grips, from
// painting over the sticky header.
export const article = style({
	'@layer': {
		recipes: {
			isolation: 'isolate',
			marginInline: 'auto',
			maxInlineSize: ARTICLE_MAX_INLINE_SIZE,
		},
	},
});

export const header = style({
	'@layer': {
		recipes: {
			marginBlockEnd: vars.space.sp32,
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

export const tocBar = style({
	'@layer': {
		recipes: {
			borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
			gridArea: 'toc-bar',
			minInlineSize: 0,
			paddingInline: vars.space.sp16,
			'@media': {
				[tabletMinWidth]: {
					paddingInline: vars.space.sp32,
				},
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
			alignItems: 'center',
			color: vars.color.text.primary,
			columnGap: vars.space.sp8,
			cursor: 'pointer',
			display: 'flex',
			fontSize: vars.font.label.fontSize,
			fontWeight: vars.font.weight.label,
			lineHeight: vars.font.label.lineHeight,
			listStyle: 'none',
			minBlockSize: vars.controlSize.medium,
			paddingBlock: vars.space.sp8,
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
			maxBlockSize: '50dvh',
			overflowY: 'auto',
			paddingBlockEnd: vars.space.sp16,
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

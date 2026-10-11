import { vars } from '@luke-ui/react/theme';
import type { ComplexStyleRule } from '@vanilla-extract/css';
import { globalStyle, style } from '@vanilla-extract/css';
import {
	docsSidebarMinInlineSize,
	docsTabletMinInlineSize,
	docsTocMinInlineSize,
} from '../../lib/docs-container-queries.js';
import { SITE_HEADER_BLOCK_SIZE } from '../site-header-size.js';

/** Block size of the sticky table of contents bar, which scroll margins must clear. */
export const TOC_BAR_BLOCK_SIZE = '3rem';

// Keep in sync with the article content `paddingInline` on `DocsArticle` so the bar label lines up.
const contentInlinePadding = {
	paddingInline: vars.space.sp16,
	'@container': {
		[docsTabletMinInlineSize]: {
			paddingInline: vars.space.sp24,
		},
		[docsSidebarMinInlineSize]: {
			paddingInline: vars.space.sp32,
		},
	},
} as const satisfies ComplexStyleRule;

// `isolation` keeps in-flow stacking inside the article, such as example resize grips, from
// painting over the sticky header.
export const article = style({
	'@layer': {
		components: {
			isolation: 'isolate',
		},
	},
});

// A chevron points along the inline axis, so it flips with the writing direction.
export const pagerIcon = style({
	'@layer': {
		components: {
			flexShrink: 0,
			marginInline: `calc(${vars.space.sp4} * -1)`,
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
		components: {
			backgroundColor: vars.color.surface.base,
			borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
			insetBlockStart: SITE_HEADER_BLOCK_SIZE,
			position: 'sticky',
			zIndex: 5,
			'@container': {
				[docsTocMinInlineSize]: {
					display: 'none',
				},
			},
		},
	},
});

export const tocSummary = style({
	'@layer': {
		components: {
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
		components: {
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
		components: {
			transform: 'rotate(180deg)',
		},
	},
});

export const tocBarPanel = style({
	'@layer': {
		components: {
			backgroundColor: vars.color.surface.overlay,
			borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
			boxShadow: vars.depth.floating,
			insetBlockStart: '100%',
			insetInline: 0,
			maxBlockSize: `min(24rem, calc(100dvh - ${SITE_HEADER_BLOCK_SIZE} - ${TOC_BAR_BLOCK_SIZE}))`,
			overflowY: 'auto',
			// Inline padding stays here so it tracks the article gutter via docs container queries.
			paddingInline: vars.space.sp16,
			position: 'absolute',
			'@container': {
				[docsTabletMinInlineSize]: {
					paddingInline: vars.space.sp24,
				},
			},
		},
	},
});

export const tocColumn = style({
	'@layer': {
		components: {
			alignSelf: 'start',
			display: 'none',
			gridArea: 'toc',
			insetBlockStart: SITE_HEADER_BLOCK_SIZE,
			maxBlockSize: `calc(100dvh - ${SITE_HEADER_BLOCK_SIZE})`,
			overflowY: 'auto',
			position: 'sticky',
			'@container': {
				[docsTocMinInlineSize]: {
					display: 'block',
				},
			},
		},
	},
});

/** Hover and current styles for TOC links. Layout lives on Box. */
export const tocLink = style({
	'@layer': {
		components: {
			borderInlineStart: '2px solid transparent',
			color: vars.color.text.secondary,
			fontSize: vars.font.label.fontSize,
			lineHeight: vars.font.label.lineHeight,
			marginInlineStart: '-1px',
			textDecoration: 'none',
			selectors: {
				'&:hover': {
					color: vars.color.text.primary,
				},
				'&[aria-current="location"]': {
					borderInlineStartColor: vars.color.border.accent,
					color: vars.color.foreground.accent.rest,
				},
			},
		},
	},
});

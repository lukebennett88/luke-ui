import { vars } from '@luke-ui/react/theme';
import { createVar, globalStyle, style } from '@vanilla-extract/css';
import { docsTocMinInlineSize } from '../../lib/docs-container-queries.js';
import { SITE_HEADER_BLOCK_SIZE } from '../site-header-size.js';
import { TOC_BAR_BLOCK_SIZE } from './docs-article.css.js';

const capCentreVar = createVar();

// Prose spaces a block from the block before it with an element selector at `:where()` strength.
// Wrappers that stand in for a prose element repeat that spacing here. The `h2 + &` style selectors
// out-rank Prose's `h2 + *` rule, so the heading gap stays the same however the cascade orders them.

export const heading = style({
	'@layer': {
		recipes: {
			// Clears the sticky header, and below the table of contents breakpoint the sticky bar too.
			scrollMarginBlockStart: `calc(${SITE_HEADER_BLOCK_SIZE} + ${TOC_BAR_BLOCK_SIZE} + ${vars.space.sp16})`,
			'@container': {
				[docsTocMinInlineSize]: {
					scrollMarginBlockStart: `calc(${SITE_HEADER_BLOCK_SIZE} + ${vars.space.sp16})`,
				},
			},
		},
	},
});

// The end margin reserves the button's inline space. Inline margin has no break opportunity before
// it, so the last word wraps together with the button instead of leaving the button alone on a new
// line.
export const headingAnchor = style({
	'@layer': {
		recipes: {
			color: 'inherit',
			marginInlineEnd: `calc(${vars.space.sp4} + ${vars.controlSize.minTarget})`,
			textDecoration: 'none',
		},
	},
});

// A zero-size inline box on the baseline, at the end of the reserved space. It adds nothing to the
// line box, so the Prose gaps around the heading and the Text cap-height trim stay intact. The
// button is positioned from the baseline.
export const headingCopyWrapper = style({
	'@layer': {
		recipes: {
			blockSize: 0,
			display: 'inline-block',
			inlineSize: 0,
			position: 'relative',
			verticalAlign: 'baseline',
		},
	},
});

// Centres the button on the cap-height band: half the band lies above the baseline. The band is the
// line height less both Capsize trims, which are negative.
function capCentre(
	typography: 'body' | 'heading1' | 'heading2' | 'heading3' | 'heading4' | 'lead',
) {
	const { baselineTrim, capHeightTrim, lineHeight } = vars.font[typography];
	return `calc((${lineHeight} + ${capHeightTrim} + ${baselineTrim}) / 2)`;
}

function wrapperForTypography(typography: Parameters<typeof capCentre>[0]) {
	return style({
		'@layer': {
			recipes: {
				vars: { [capCentreVar]: capCentre(typography) },
			},
		},
	});
}

export const headingCopyWrapperByLevel = {
	1: wrapperForTypography('heading1'),
	2: wrapperForTypography('heading2'),
	3: wrapperForTypography('heading3'),
	4: wrapperForTypography('heading4'),
	5: wrapperForTypography('lead'),
	6: wrapperForTypography('body'),
};

// The control size token is 32px. A 24px target keeps the button quiet beside the heading text and
// still meets the minimum target size. Hidden until the heading is hovered or keyboard focus is
// inside it. A mouse click leaves `:focus-visible` unset, so it does not pin the button open.
export const headingCopyButton = style({
	'@layer': {
		recipes: {
			blockSize: vars.controlSize.minTarget,
			color: vars.color.text.secondary,
			// The Capsize trims in `translate` are in `em`, so the button takes the heading's font size.
			fontSize: 'inherit',
			inlineSize: vars.controlSize.minTarget,
			insetBlockStart: 0,
			insetInlineEnd: 0,
			minBlockSize: 0,
			opacity: 0,
			position: 'absolute',
			translate: `0 calc(-50% - ${capCentreVar})`,
			transition: `opacity ${vars.motion.duration.feedback} ${vars.motion.easing.standard}`,
			selectors: {
				'&:hover': {
					color: vars.color.text.primary,
				},
				[`${heading}:hover &, ${heading}:has(:focus-visible) &`]: {
					opacity: 1,
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

export const image = style({
	'@layer': {
		recipes: {
			blockSize: 'auto',
			borderRadius: vars.radius.surface,
			maxInlineSize: '100%',
		},
	},
});

export const tableScroll = style({
	'@layer': {
		recipes: {
			border: `1px solid ${vars.color.border.decorative}`,
			borderRadius: vars.radius.surface,
			marginBlockStart: vars.space.sp40,
			selectors: {
				'h2 + &': { marginBlockStart: vars.space.sp32 },
				'h3 + &': { marginBlockStart: vars.space.sp24 },
				'h4 + &, h5 + &, h6 + &': { marginBlockStart: vars.space.sp16 },
			},
		},
	},
});

export const table = style({
	'@layer': {
		recipes: {
			inlineSize: '100%',
		},
	},
});

globalStyle(`${table} th, ${table} td`, {
	'@layer': {
		recipes: {
			borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
			verticalAlign: 'top',
		},
	},
});

globalStyle(`${table} th`, {
	'@layer': {
		recipes: {
			backgroundColor: vars.color.surface.recessed,
			fontWeight: vars.font.weight.label,
		},
	},
});

globalStyle(`${table} tbody tr:last-child td`, {
	'@layer': {
		recipes: {
			borderBlockEnd: 0,
		},
	},
});

export const cards = style({
	'@layer': {
		recipes: {
			display: 'grid',
			gap: vars.space.sp16,
			gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 20rem), 1fr))',
			marginBlockStart: vars.space.sp32,
		},
	},
});

export const cardRow = style({
	'@layer': {
		recipes: {
			alignItems: 'center',
			columnGap: vars.space.sp12,
			display: 'flex',
			justifyContent: 'space-between',
		},
	},
});

export const cardIcon = style({
	'@layer': {
		recipes: {
			color: vars.color.text.secondary,
			flexShrink: 0,
			selectors: {
				'&:dir(rtl)': {
					transform: 'scaleX(-1)',
				},
			},
		},
	},
});

export const cardTitle = style({});

// The two-class selector out-ranks the Prose margin rules that follow a heading.
export const cardDescription = style({
	'@layer': {
		recipes: {
			selectors: {
				[`${cardTitle} + &`]: {
					marginBlockStart: vars.space.sp4,
				},
			},
		},
	},
});

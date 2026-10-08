import { vars } from '@luke-ui/react/theme';
import { globalStyle, style } from '@vanilla-extract/css';
import { SITE_HEADER_BLOCK_SIZE } from '../site-header-size.js';

// Prose spaces a block from the block before it with an element selector at `:where()` strength.
// Wrappers that stand in for a prose element repeat that spacing here. The `h2 + &` style selectors
// out-rank Prose's `h2 + *` rule, so the heading gap stays the same however the cascade orders them.

export const heading = style({
	'@layer': {
		recipes: {
			// Clears the sticky header and a little breathing room when a heading is a link target.
			scrollMarginBlockStart: `calc(${SITE_HEADER_BLOCK_SIZE} + ${vars.space.sp16})`,
		},
	},
});

export const headingAnchor = style({
	'@layer': {
		recipes: {
			color: 'inherit',
			textDecoration: 'none',
			selectors: {
				'&:hover': {
					textDecoration: 'underline',
				},
			},
		},
	},
});

// Visible on hover and whenever focus is inside the heading. Touch screens have no hover, so the
// button stays visible there.
export const headingCopyButton = style({
	'@layer': {
		recipes: {
			marginBlock: '-0.5rem',
			marginInlineStart: vars.space.sp8,
			opacity: 0,
			verticalAlign: 'middle',
			'@media': {
				'(hover: none)': {
					opacity: 1,
				},
			},
			selectors: {
				[`${heading}:hover &, ${heading}:focus-within &`]: {
					opacity: 1,
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
			marginBlockStart: vars.space.sp32,
			selectors: {
				'h2 + &': { marginBlockStart: vars.space.sp24 },
				'h3 + &': { marginBlockStart: vars.space.sp16 },
				'h4 + &, h5 + &, h6 + &': { marginBlockStart: vars.space.sp12 },
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
			marginBlockStart: vars.space.sp24,
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

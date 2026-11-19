import { vars } from '@luke-ui/react/theme';
import { globalStyle, style } from '@vanilla-extract/css';
import { compactQuery } from '../styles/queries.js';

export const main = style({
	boxSizing: 'border-box',
	display: 'grid',
	gap: vars.space['32'],
	marginInline: 'auto',
	maxInlineSize: '56rem',
	paddingBlock: `${vars.space['40']} ${vars.space['64']}`,
	paddingInline: vars.space['24'],
	'@container': {
		[compactQuery]: {
			gap: vars.space['24'],
			paddingBlock: `${vars.space['24']} ${vars.space['40']}`,
			paddingInline: vars.space['12'],
		},
	},
});

export const intro = style({
	display: 'grid',
	gap: vars.space['12'],
	paddingInline: vars.space['4'],
});

export const group = style({
	display: 'grid',
	gap: vars.space['8'],
});

export const groupTitle = style({
	paddingInline: vars.space['4'],
});

export const list = style({
	display: 'grid',
	gap: vars.space['4'],
	listStyle: 'none',
	margin: 0,
	padding: 0,
});

/**
 * One reviewable report, in the tone of the review page's section headers. The title's link covers
 * the whole row, so the row is one target; the Review button sits above that link.
 */
export const row = style({
	alignItems: 'center',
	borderRadius: vars.radius.surface,
	boxSizing: 'border-box',
	columnGap: vars.space['24'],
	display: 'grid',
	gridTemplateColumns: 'minmax(0, 1fr) auto',
	minBlockSize: '64px',
	paddingBlock: vars.space['12'],
	paddingInline: `${vars.space['16']} ${vars.space['12']}`,
	position: 'relative',
	rowGap: vars.space['8'],
	'@container': {
		[compactQuery]: {
			gridTemplateColumns: 'minmax(0, 1fr)',
			paddingInline: vars.space['12'],
		},
	},
	selectors: {
		'&:has(a:hover)': {
			backgroundImage: `linear-gradient(${vars.interaction.tint.hover}, ${vars.interaction.tint.hover})`,
		},
	},
});

export const rowText = style({
	display: 'grid',
	gap: vars.space['4'],
	minInlineSize: 0,
});

export const title = style({
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
});

export const number = style({
	color: vars.color.foreground.secondary,
	fontVariantNumeric: 'tabular-nums',
	marginInlineEnd: vars.space['8'],
});

// Stretches the title's link over the row.
globalStyle(`${title} a::after`, {
	content: '""',
	inset: 0,
	position: 'absolute',
});

globalStyle(`${title} a`, {
	color: 'inherit',
	textDecoration: 'none',
});

export const meta = style({
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
});

export const rowEnd = style({
	alignItems: 'center',
	display: 'flex',
	flexWrap: 'wrap',
	gap: `${vars.space['8']} ${vars.space['16']}`,
	justifyContent: 'flex-end',
	'@container': {
		[compactQuery]: {
			justifyContent: 'space-between',
		},
	},
});

// Interactive content in a row stays above the stretched link.
globalStyle(`${rowEnd} a`, {
	position: 'relative',
	zIndex: 1,
});

/** A status in its role colour, with an icon where the state has one. */
export const status = style({
	alignItems: 'center',
	display: 'inline-flex',
	gap: vars.space['4'],
	whiteSpace: 'nowrap',
});

export const notice = style({
	borderRadius: vars.radius.surface,
	margin: 0,
	padding: vars.space['16'],
});

import { vars } from '@luke-ui/react/theme';
import { globalStyle, style } from '@vanilla-extract/css';
import { NARROW } from './reference-table.css.js';
import { SITE_HEADER_BLOCK_SIZE } from './site-header-size.js';

// Table styling shared with the token tables lives in `reference-table.css.ts`. These rules are
// specific to the props tables, and each names the design system capability that is missing.

// DS gap: same as `hideNarrow`, inverted. Only the stacked layout labels the default value,
// because the Default column header is hidden there.
export const narrowOnly = style({
	'@layer': {
		components: {
			display: 'none',
			'@container': {
				[NARROW]: {
					display: 'inline',
				},
			},
		},
	},
});

// DS gap: Box has no scrollMargin prop. Hash targets clear the sticky site header.
export const dataRow = style({
	'@layer': {
		components: {
			scrollMarginBlockStart: `calc(${SITE_HEADER_BLOCK_SIZE} + ${vars.space.sp24})`,
		},
	},
});

// DS gap: no rich-text primitive for MDX descriptions. Their paragraphs carry user agent margins,
// and `Text` cannot reset or space the paragraphs of a `ReactNode` it wraps.
export const richText = style({});

globalStyle(`${richText} p`, {
	'@layer': {
		components: {
			margin: 0,
		},
	},
});

globalStyle(`${richText} p + p`, {
	'@layer': {
		components: {
			marginBlockStart: vars.space.sp8,
		},
	},
});

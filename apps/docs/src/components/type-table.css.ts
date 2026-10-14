import { vars } from '@luke-ui/react/theme';
import { globalStyle, style } from '@vanilla-extract/css';
import { SITE_HEADER_BLOCK_SIZE } from './site-header-size.js';

/**
 * Named container, so the narrow layout follows the table's own column instead of the viewport.
 * It sits below `:root`, so it is named: the shell's unnamed queries keep resolving against the
 * root (see `lib/docs-container-queries.ts`).
 */
const TABLE_CONTAINER = 'type-table';
/** Below this inline size the columns stack, as React Aria's API tables do below `sm`. */
const NARROW = `${TABLE_CONTAINER} (inline-size < 30rem)`;

export const frame = style({
	'@layer': {
		components: {
			containerName: TABLE_CONTAINER,
			containerType: 'inline-size',
			maxInlineSize: '100%',
		},
	},
});

export const table = style({
	'@layer': {
		components: {
			backgroundColor: vars.color.surface.base,
			borderColor: vars.color.border.decorative,
			borderRadius: vars.radius.surface,
			borderStyle: 'solid',
			borderWidth: '1px',
			borderCollapse: 'separate',
			borderSpacing: 0,
			color: vars.color.text.primary,
			fontFamily: vars.font.family.body,
			fontSize: vars.font.label.fontSize,
			inlineSize: '100%',
			lineHeight: vars.font.label.lineHeight,
			margin: 0,
			overflow: 'hidden',
			// Fixed columns keep Name, Type, and Default aligned when a group expands. The stacked
			// layout does not use columns, so it goes back to automatic.
			tableLayout: 'fixed',
			'@container': {
				[NARROW]: {
					tableLayout: 'auto',
				},
			},
		},
	},
});

export const nameColumn = style({
	'@layer': {
		components: {
			inlineSize: '30%',
			'@container': {
				[NARROW]: {
					display: 'none',
				},
			},
		},
	},
});

export const defaultColumn = style({
	'@layer': {
		components: {
			inlineSize: '20%',
			'@container': {
				[NARROW]: {
					display: 'none',
				},
			},
		},
	},
});

export const head = style({
	'@layer': {
		components: {
			backgroundColor: vars.color.surface.subdued,
			'@container': {
				[NARROW]: {
					display: 'none',
				},
			},
		},
	},
});

export const columnHeader = style({
	'@layer': {
		components: {
			blockSize: '2rem',
			borderBlockEndColor: vars.color.border.decorative,
			borderBlockEndStyle: 'solid',
			borderBlockEndWidth: '1px',
			boxSizing: 'border-box',
			fontWeight: vars.font.weight.label,
			paddingInline: vars.space.sp16,
			textAlign: 'start',
		},
	},
});

/**
 * Shared cell chrome: the row rule and the narrow `display: block`. A cell carries `data-ruled`
 * when a rule belongs under it and `data-row-end` when it is the last cell the narrow layout shows,
 * which keeps one rule under each stacked row. The last row of the last body never has a rule.
 */
export const cell = style({
	'@layer': {
		components: {
			borderBlockEndColor: vars.color.border.decorative,
			borderBlockEndStyle: 'solid',
			borderBlockEndWidth: 0,
			boxSizing: 'border-box',
			textAlign: 'start',
			verticalAlign: 'middle',
			selectors: {
				'&[data-ruled]': {
					borderBlockEndWidth: '1px',
				},
				'tbody:last-child > tr:last-child > &': {
					borderBlockEndWidth: 0,
				},
			},
			'@container': {
				[NARROW]: {
					display: 'block',
					selectors: {
						'&[data-ruled]:not([data-row-end])': {
							borderBlockEndWidth: 0,
						},
					},
				},
			},
		},
	},
});

/** A prop's first row. Hash targets clear the sticky site header. */
export const dataRow = style({
	'@layer': {
		components: {
			scrollMarginBlockStart: `calc(${SITE_HEADER_BLOCK_SIZE} + ${vars.space.sp24})`,
		},
	},
});

export const dataCell = style({
	'@layer': {
		components: {
			blockSize: '2.5rem',
			fontFamily: vars.font.family.code,
			paddingBlock: 0,
			paddingInline: vars.space.sp16,
			selectors: {
				// The description sits directly below, so the name and type hug it from the top.
				'&[data-described]': {
					blockSize: 'auto',
					paddingBlockStart: vars.space.sp12,
					verticalAlign: 'top',
				},
			},
			'@container': {
				[NARROW]: {
					blockSize: 'auto',
					paddingBlockStart: vars.space.sp4,
					selectors: {
						'&:first-child': {
							paddingBlockStart: vars.space.sp8,
						},
						'&:last-child, &[data-row-end]': {
							paddingBlockEnd: vars.space.sp4,
						},
					},
				},
			},
		},
	},
});

export const propName = style({
	'@layer': {
		components: {
			color: vars.color.foreground.accent.rest,
			fontWeight: vars.font.weight.label,
			overflowWrap: 'anywhere',
		},
	},
});

export const propNameDeprecated = style({
	'@layer': {
		components: {
			color: vars.color.text.secondary,
			textDecoration: 'line-through',
		},
	},
});

export const requiredMark = style({
	'@layer': {
		components: {
			color: vars.color.text.secondary,
			marginInlineStart: vars.space.sp4,
		},
	},
});

/**
 * Long union types wrap instead of forcing horizontal scroll in the article column. Nested
 * Shiki/`Code` chips are stripped via `globalStyle` below.
 */
export const propType = style({
	'@layer': {
		components: {
			overflowWrap: 'anywhere',
		},
	},
});

export const propTypeLink = style({
	'@layer': {
		components: {
			textUnderlineOffset: '0.15em',
		},
	},
});

export const defaultCell = style({
	'@layer': {
		components: {
			overflowWrap: 'anywhere',
		},
	},
});

/** Only the narrow layout labels the value, because the Default column header is hidden there. */
export const defaultLabel = style({
	'@layer': {
		components: {
			display: 'none',
			fontFamily: vars.font.family.body,
			fontWeight: vars.font.weight.label,
			'@container': {
				[NARROW]: {
					display: 'inline',
				},
			},
		},
	},
});

/** Rows without a default drop the whole cell in the narrow layout, where there is no column. */
export const emptyDefault = style({
	'@layer': {
		components: {
			color: vars.color.text.secondary,
			'@container': {
				[NARROW]: {
					display: 'none',
				},
			},
		},
	},
});

export const descriptionCell = style({
	'@layer': {
		components: {
			paddingBlockEnd: vars.space.sp12,
			paddingBlockStart: vars.space.sp4,
			paddingInline: vars.space.sp16,
			verticalAlign: 'top',
			'@container': {
				[NARROW]: {
					paddingBlockEnd: vars.space.sp8,
				},
			},
		},
	},
});

export const metaList = style({
	'@layer': {
		components: {
			display: 'grid',
			gap: vars.space.sp4,
			marginBlockStart: vars.space.sp8,
		},
	},
});

export const metaLabel = style({
	'@layer': {
		components: {
			color: vars.color.text.secondary,
			fontWeight: vars.font.weight.label,
		},
	},
});

export const paramName = style({
	'@layer': {
		components: {
			fontFamily: vars.font.family.code,
			fontWeight: vars.font.weight.label,
		},
	},
});

// MDX descriptions render paragraphs, which carry user agent margins.
globalStyle(`${descriptionCell} p`, {
	'@layer': {
		components: {
			margin: 0,
		},
	},
});

globalStyle(`${descriptionCell} p + p`, {
	'@layer': {
		components: {
			marginBlockStart: vars.space.sp8,
		},
	},
});

const flatNestedCode = {
	backgroundColor: 'transparent',
	borderColor: 'transparent',
	borderRadius: 0,
	borderStyle: 'none',
	borderWidth: 0,
	fontSize: 'inherit',
	lineHeight: 'inherit',
	paddingBlock: 0,
	paddingInline: 0,
} as const;

/** Generator `typeDescription` and `default` nodes often wrap Shiki/`Code` chips — flatten them. */
for (const container of [propType, defaultCell]) {
	globalStyle(`${container} code`, {
		'@layer': {
			components: flatNestedCode,
		},
	});
}

globalStyle(`${propTypeLink} code`, {
	'@layer': {
		components: {
			backgroundColor: 'transparent',
			borderColor: 'transparent',
			borderRadius: 0,
			borderStyle: 'none',
			borderWidth: 0,
			paddingBlock: 0,
			paddingInline: 0,
		},
	},
});

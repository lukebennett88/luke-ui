import { vars } from '@luke-ui/react/theme';
import { globalStyle, style } from '@vanilla-extract/css';

// Styles for the docs reference tables (the props tables and the token tables). Everything not
// expressed through `Box`, `Text`, `Stack`, or `Cluster` props lives here, and each rule names the
// design system capability that is missing. These rules sit in the docs `components` layer, which
// ranks above Luke UI's layers, so they also win over any Box prop.

/**
 * Named container, so the narrow layout follows the table's own column instead of the viewport.
 * It sits below `:root`, so it is named: the shell's unnamed queries keep resolving against the
 * root (see `lib/docs-container-queries.ts`).
 */
const TABLE_CONTAINER = 'reference-table';
/** Below this inline size the columns stack, as React Aria's API tables do below `sm`. */
export const NARROW = `${TABLE_CONTAINER} (inline-size < 30rem)`;

// DS gap: Box has no containerType or containerName prop, and its responsive props resolve against
// the root container, not a component's own width.
export const frame = style({
	'@layer': {
		components: {
			containerName: TABLE_CONTAINER,
			containerType: 'inline-size',
		},
	},
});

// DS gap: Box has no tableLayout, borderCollapse, or borderSpacing prop. Separate borders keep the
// radius, and fixed columns keep Name, Type, and Default aligned when a group expands. The stacked
// layout does not use columns, so it goes back to automatic.
// DS gap: Box has no typography prop, so inline `Text` in a cell sits on the page's line box, not
// the label style's. The table sets the label metrics for the cell's own line box.
export const table = style({
	'@layer': {
		components: {
			borderCollapse: 'separate',
			borderSpacing: 0,
			fontSize: vars.font.label.fontSize,
			lineHeight: vars.font.label.lineHeight,
			tableLayout: 'fixed',
			'@container': {
				[NARROW]: {
					tableLayout: 'auto',
				},
			},
		},
	},
});

// DS gap: Box has no verticalAlign prop. Table cells inherit it from their row group.
export const bodyGroup = style({
	'@layer': {
		components: {
			verticalAlign: 'top',
		},
	},
});

// DS gap: same as `bodyGroup`, centred. Token rows pair a taller sample with one line of text.
export const bodyGroupCentered = style({
	'@layer': {
		components: {
			verticalAlign: 'middle',
		},
	},
});

// DS gap: Box has no per-side border props (the row rule is a block-end border), no textAlign, no
// `:last-child` selectors, and no container-query display. A cell carries `data-ruled` when a rule
// belongs under it and `data-row-end` when it is the last cell the narrow layout shows, which keeps
// one rule under each stacked row. The last row of the last body never has a rule.
export const cell = style({
	'@layer': {
		components: {
			textAlign: 'start',
			selectors: {
				'&[data-ruled]': {
					borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
				},
				'tbody:last-child > tr:last-child > &': {
					borderBlockEnd: 'none',
				},
			},
			'@container': {
				[NARROW]: {
					display: 'block',
					selectors: {
						'&[data-ruled]:not([data-row-end])': {
							borderBlockEnd: 'none',
						},
					},
				},
			},
		},
	},
});

// DS gap: Box padding cannot change with a container query or a position in the row. Stacked cells
// sit sp4 apart, with sp16 above the name and after the last line of a stacked row. A cell with a
// description below it is not the end of its row, and the description cell is not its start.
export const stackedCell = style({
	'@layer': {
		components: {
			'@container': {
				[NARROW]: {
					paddingBlockEnd: 0,
					paddingBlockStart: vars.space.sp4,
					selectors: {
						'&:first-child:not([colspan])': {
							paddingBlockStart: vars.space.sp16,
						},
						'&[data-row-end][data-ruled]': {
							paddingBlockEnd: vars.space.sp16,
						},
					},
				},
			},
		},
	},
});

// DS gap: Box has no container-query display. The header, its columns, and a missing default have
// no place in the stacked layout. This follows `cell` so `display: none` wins over `display: block`.
export const hideNarrow = style({
	'@layer': {
		components: {
			'@container': {
				[NARROW]: {
					display: 'none',
				},
			},
		},
	},
});

// DS gap: Text has no font family prop, and `Code` always draws a chip. Prop names, types, and
// defaults want the code font without one.
// DS gap: Box has no overflowWrap prop or container-query props. In the stacked layout a long
// unbreakable CSS variable name would stretch the table past its frame, so it may break anywhere.
export const monospace = style({
	'@layer': {
		components: {
			fontFamily: vars.font.family.code,
			'@container': {
				[NARROW]: {
					overflowWrap: 'anywhere',
				},
			},
		},
	},
});

// DS gap: no primitive flattens nested code. Generator `typeDescription` and `default` nodes often
// wrap Shiki or `Code` chips, which should read as plain monospace text in a cell.
globalStyle(`${monospace} code`, {
	'@layer': {
		components: {
			backgroundColor: 'transparent',
			borderColor: 'transparent',
			borderRadius: 0,
			borderStyle: 'none',
			borderWidth: 0,
			fontSize: 'inherit',
			lineHeight: 'inherit',
			paddingBlock: 0,
			paddingInline: 0,
		},
	},
});

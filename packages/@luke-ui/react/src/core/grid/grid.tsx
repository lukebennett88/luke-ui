import type { JSX } from 'react';
import { cx, mergeStyleProps } from '../../shared/utils/utils.js';
import { Box, omitUnsupportedSprinklesProps } from '../box/box.js';
import type { LayoutProps } from '../styles/layout-props.js';
import { layoutProperties } from '../styles/layout-props.js';
import { resolveResponsiveCssProperty } from '../styles/responsive-css-property.js';
import { isNonEmptyString, isPositiveInteger } from '../styles/responsive.js';
import type {
	RequiredInitialResponsive,
	RequiredInitialResponsiveValue,
} from '../styles/responsive.js';
import type { SprinklesProps } from '../styles/utilities.css.js';
import type { BoxLikeElementProps, BoxLikeRenderProps } from '../types/box-like-props.js';
import type { Prettify } from '../types/prettify.js';
import {
	gridAreasProperty,
	gridColumnsProperty,
	gridRowsProperty,
	gridRecipe,
} from './recipe.css.js';

/** Props for `Grid`. */
export type GridProps = Prettify<_GridElementProps | _GridRenderProps>;

/** Lays out direct children on a CSS grid with column tracks, row tracks, and named areas. */
export function Grid({
	alignContent,
	alignItems,
	areas,
	className,
	columnGap,
	columns,
	gap,
	justifyContent,
	justifyItems,
	rowGap,
	rows,
	style,
	...props
}: GridProps): JSX.Element {
	const columnsStyle =
		columns == null
			? undefined
			: resolveResponsiveCssProperty<number | string>(columns, gridColumnsProperty, {
					expectedValueDescription:
						'a positive integer such as 3, or a CSS track list such as "12rem 1fr"',
					format: formatColumns,
					isValid: isValidColumns,
					propName: 'columns',
				});
	const rowsStyle =
		rows == null
			? undefined
			: resolveResponsiveCssProperty<string>(rows, gridRowsProperty, {
					expectedValueDescription: 'a non-empty CSS track list',
					isValid: isNonEmptyString,
					propName: 'rows',
				});
	const areasStyle =
		areas == null
			? undefined
			: resolveResponsiveCssProperty<ReadonlyArray<string>>(areas, gridAreasProperty, {
					expectedValueDescription:
						'one or more non-empty rows without double quotes, each with the same number of cells',
					format: formatAreas,
					isValid: isValidAreas,
					propName: 'areas',
				});

	return (
		<Box
			{...omitUnsupportedSprinklesProps(props, layoutProperties)}
			{...mergeStyleProps(
				{
					className: gridRecipe({
						className: cx(
							columnsStyle?.className,
							rowsStyle?.className,
							areasStyle?.className,
							className,
						),
					}),
					style: { ...columnsStyle?.style, ...rowsStyle?.style, ...areasStyle?.style },
				},
				{ style },
			)}
			alignContent={alignContent}
			alignItems={alignItems}
			columnGap={columnGap}
			gap={gap}
			justifyContent={justifyContent}
			justifyItems={justifyItems}
			rowGap={rowGap}
		/>
	);
}

interface _GridLayoutProps {
	/**
	 * Column tracks.
	 *
	 * Pass a positive integer for that many equal columns that can shrink below their content's
	 * width, or a CSS track list such as `"12rem 1fr"` to use as `grid-template-columns`. Accepts a
	 * responsive object with a required `initial` value, and each breakpoint can use either form.
	 * When neither `columns` nor `areas` sets column tracks, the grid has one unprotected auto-sized
	 * column. Pass `1` for a single `minmax(0, 1fr)` column instead.
	 */
	columns?: RequiredInitialResponsiveValue<number | string>;
	/**
	 * Row tracks, as a CSS track list such as `"auto 1fr auto"`.
	 *
	 * Accepts a responsive object with a required `initial` value. There is deliberately no numeric
	 * shorthand, because rows are usually auto-sized.
	 */
	rows?: RequiredInitialResponsiveValue<string>;
	/**
	 * Named grid areas, one string per row, such as `['a a', 'b c']`.
	 *
	 * Each row needs the same number of cells. Use `.` for an empty cell. Without `columns`, the
	 * column tracks that `areas` creates are auto-sized. Accepts a responsive object with a required
	 * `initial` value.
	 */
	areas?: ResponsiveGridAreas;
	/** Space between grid tracks. */
	gap?: RequiredInitialResponsive<SprinklesProps['gap']>;
	/** Space between row tracks. Overrides `gap` on the block axis. */
	rowGap?: RequiredInitialResponsive<SprinklesProps['gap']>;
	/** Space between column tracks. Overrides `gap` on the inline axis. */
	columnGap?: RequiredInitialResponsive<SprinklesProps['gap']>;
	/** Alignment of each child within its grid area on the block axis. */
	alignItems?: SprinklesProps['alignItems'];
	/** Alignment of each child within its grid area on the inline axis. */
	justifyItems?: SprinklesProps['justifyItems'];
	/** Distribution of row tracks within the grid on the block axis. */
	alignContent?: SprinklesProps['alignContent'];
	/** Distribution of column tracks within the grid on the inline axis. */
	justifyContent?: SprinklesProps['justifyContent'];
}

/**
 * Private name for the `areas` type so the generated props table shows it instead of `union`. It
 * includes `undefined` so the optional prop keeps the alias rather than a flattened union.
 */
type ResponsiveGridAreas = RequiredInitialResponsiveValue<ReadonlyArray<string>> | undefined;

interface _GridElementProps extends BoxLikeElementProps, LayoutProps, _GridLayoutProps {}

interface _GridRenderProps extends BoxLikeRenderProps, LayoutProps, _GridLayoutProps {}

/** A trimmed numeric-looking string, such as `"3"`, `"-1"`, or `"1.5"`. */
const NUMERIC_STRING_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)$/;

/** One area cell: a run of `.` for an empty cell, or a name. `a..b` is three cells. */
const AREA_CELL_PATTERN = /\.+|[^\s.]+/g;

function isValidColumns(value: number | string): boolean {
	if (typeof value === 'number') return isPositiveInteger(value);
	return isNonEmptyString(value) && !NUMERIC_STRING_PATTERN.test(value.trim());
}

function formatColumns(value: number | string): string {
	return typeof value === 'number' ? `repeat(${value}, minmax(0, 1fr))` : value;
}

function isValidAreas(rows: ReadonlyArray<string>): boolean {
	if (rows.length === 0) return false;
	const cellCounts = new Set<number>();
	for (const row of rows) {
		if (!isNonEmptyString(row) || row.includes('"')) return false;
		cellCounts.add(row.match(AREA_CELL_PATTERN)?.length ?? 0);
	}
	return cellCounts.size === 1;
}

function formatAreas(rows: ReadonlyArray<string>): string {
	return rows.map((row) => `"${row}"`).join(' ');
}

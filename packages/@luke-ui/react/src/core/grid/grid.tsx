import type { JSX } from 'react';
import { mergeStyleProps } from '../../shared/utils/utils.js';
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
import { formatAreas, isValidAreas } from './areas.js';
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
						'named-area rows with equal cell counts that form filled rectangles',
					format: formatAreas,
					isValid: isValidAreas,
					propName: 'areas',
				});

	return (
		<Box
			{...omitUnsupportedSprinklesProps(props, layoutProperties)}
			{...mergeStyleProps(columnsStyle ?? {}, rowsStyle ?? {}, areasStyle ?? {}, {
				className: gridRecipe({ className }),
				style,
			})}
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
	 * A positive integer creates that many equal columns that can shrink below their content width.
	 * A non-empty string is used as `grid-template-columns`. Accepts a responsive object with a
	 * required `initial` value, and each breakpoint can use either form.
	 */
	columns?: RequiredInitialResponsiveValue<number | string>;
	/**
	 * Row tracks, as a CSS track list such as `"auto 1fr auto"`.
	 *
	 * Accepts a responsive object with a required `initial` value.
	 */
	rows?: RequiredInitialResponsiveValue<string>;
	/**
	 * Named grid areas, one string per row, such as `['a a', 'b c']`.
	 *
	 * Each row needs the same number of cells, and each named area must form a filled rectangle. Use
	 * `.` for an empty cell. Accepts a responsive object with a required `initial` value.
	 */
	areas?: RequiredInitialResponsiveValue<ReadonlyArray<string>>;
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

interface _GridElementProps extends BoxLikeElementProps, LayoutProps, _GridLayoutProps {}

interface _GridRenderProps extends BoxLikeRenderProps, LayoutProps, _GridLayoutProps {}

/** Digit-only strings such as `"3"`, which look like the numeric columns shorthand in JSX. */
const DIGIT_ONLY_STRING_PATTERN = /^\d+$/;

function isValidColumns(value: number | string): boolean {
	if (typeof value === 'number') return isPositiveInteger(value);
	return isNonEmptyString(value) && !DIGIT_ONLY_STRING_PATTERN.test(value);
}

function formatColumns(value: number | string): string {
	return typeof value === 'number' ? `repeat(${value}, minmax(0, 1fr))` : value;
}

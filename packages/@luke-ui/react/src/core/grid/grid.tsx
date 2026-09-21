import type { JSX } from 'react';
import { cx, mergeStyleProps } from '../../shared/utils/utils.js';
import { Box, omitUnsupportedSprinklesProps } from '../box/box.js';
import type { LayoutProps } from '../styles/layout-props.js';
import { layoutProperties } from '../styles/layout-props.js';
import { isPositiveInteger, type RequiredInitialResponsive } from '../styles/responsive.js';
import { resolveResponsiveCssProperty } from '../styles/responsive-css-property.js';
import type { SprinklesProps } from '../styles/utilities.css.js';
import type { BoxLikeElementProps, BoxLikeRenderProps } from '../types/box-like-props.js';
import type { Prettify } from '../types/prettify.js';
import { gridColumnsProperty, gridRecipe } from './recipe.css.js';

/** Props for `Grid`. */
export type GridProps = Prettify<_GridElementProps | _GridRenderProps>;

/** Lays out direct children in an equal explicit column grid. */
export function Grid({ className, columns, gap, style, ...props }: GridProps): JSX.Element {
	const columnsStyle = resolveResponsiveCssProperty(columns, gridColumnsProperty, {
		isValid: isPositiveInteger,
		propName: 'columns',
	});

	return (
		<Box
			{...omitUnsupportedSprinklesProps(props, layoutProperties)}
			{...mergeStyleProps(
				{
					className: gridRecipe({ className: cx(columnsStyle.className, className) }),
					style: columnsStyle.style,
				},
				{ style },
			)}
			gap={gap}
		/>
	);
}

interface _GridLayoutProps {
	/**
	 * Number of equal explicit columns.
	 *
	 * Accepts a positive integer, or a responsive object with a required `initial` value. Each
	 * active value must be a positive integer.
	 */
	columns: RequiredInitialResponsive<number>;
	/** Space between grid tracks. */
	gap?: RequiredInitialResponsive<SprinklesProps['gap']>;
}

interface _GridElementProps extends BoxLikeElementProps, LayoutProps, _GridLayoutProps {}

interface _GridRenderProps extends BoxLikeRenderProps, LayoutProps, _GridLayoutProps {}

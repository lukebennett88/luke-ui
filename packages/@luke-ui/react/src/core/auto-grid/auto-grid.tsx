import type { JSX } from 'react';
import { cx, mergeStyleProps } from '../../shared/utils/utils.js';
import { Box, omitUnsupportedSprinklesProps } from '../box/box.js';
import type { LayoutProps } from '../styles/layout-props.js';
import { layoutProperties } from '../styles/layout-props.js';
import { resolveResponsiveCssProperty } from '../styles/responsive-css-property.js';
import type {
	RequiredInitialResponsive,
	RequiredInitialResponsiveValue,
} from '../styles/responsive.js';
import type { SprinklesProps } from '../styles/utilities.css.js';
import type { BoxLikeElementProps, BoxLikeRenderProps } from '../types/box-like-props.js';
import type { Prettify } from '../types/prettify.js';
import { autoGridMinColumnInlineSizeProperty, autoGridRecipe } from './recipe.css.js';

/** Props for `AutoGrid`. */
export type AutoGridProps = Prettify<_AutoGridElementProps | _AutoGridRenderProps>;

/** Lays out direct children in an intrinsic equal-column grid. */
export function AutoGrid({
	className,
	gap,
	minColumnInlineSize,
	style,
	...props
}: AutoGridProps): JSX.Element {
	const minColumnInlineSizeStyle = resolveResponsiveCssProperty(
		minColumnInlineSize,
		autoGridMinColumnInlineSizeProperty,
		{
			isValid: isCssLength,
			propName: 'minColumnInlineSize',
		},
	);

	return (
		<Box
			{...omitUnsupportedSprinklesProps(props, layoutProperties)}
			{...mergeStyleProps(
				{
					className: autoGridRecipe({
						className: cx(minColumnInlineSizeStyle.className, className),
					}),
					style: minColumnInlineSizeStyle.style,
				},
				{ style },
			)}
			gap={gap}
		/>
	);
}

interface _AutoGridLayoutProps {
	/**
	 * Minimum inline size of each auto-fit column.
	 *
	 * Accepts a CSS length, or a responsive object with a required `initial` value. Columns use
	 * `min(value, 100%)` so a narrow parent cannot overflow.
	 */
	minColumnInlineSize: RequiredInitialResponsiveValue<string>;
	/** Space between grid tracks. */
	gap?: RequiredInitialResponsive<SprinklesProps['gap']>;
}

interface _AutoGridElementProps extends BoxLikeElementProps, LayoutProps, _AutoGridLayoutProps {}

interface _AutoGridRenderProps extends BoxLikeRenderProps, LayoutProps, _AutoGridLayoutProps {}

function isCssLength(value: string | number): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}

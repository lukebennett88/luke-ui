import type { JSX } from 'react';
import { mergeProps } from '../../shared/utils/merge-props.js';
import { Box } from '../box/box.js';
import type { ResponsivePropValue } from '../styles/responsive.js';
import { createSprinkles } from '../styles/utilities.css.js';
import type { BoxLikeElementProps, BoxLikeRenderProps } from '../types/box-like-props.js';
import type { Prettify } from '../types/prettify.js';

/**
 * A grid line placement: `auto`, a line number, a span, or a start and end line.
 *
 * `${number}` accepts any numeric string, so `"1.5"` compiles. It is not an integer validator, and
 * CSS ignores a placement it cannot parse. Named lines belong in `className`.
 */
type GridItemPlacement =
	| 'auto'
	| 'span 2'
	| 'span 3'
	| 'span 4'
	| '1 / -1'
	| `${number}`
	| `span ${number}`
	| `${number} / ${number}`
	| `${number} / span ${number}`;

interface _GridItemPlacementProps {
	/**
	 * Name of the grid area to occupy. Pass one of the names in the parent `Grid`'s `areas`.
	 *
	 * The value is a plain string, so a name that the parent grid does not define compiles. Accepts a
	 * responsive object.
	 */
	area?: ResponsivePropValue<string>;
	/**
	 * Column lines to occupy, such as `"span 2"` or `"1 / -1"`. Named lines belong in `className`.
	 * Accepts a responsive object.
	 */
	column?: ResponsivePropValue<GridItemPlacement>;
	/**
	 * Row lines to occupy, such as `"span 2"` or `"1 / 3"`. Named lines belong in `className`.
	 * Accepts a responsive object.
	 */
	row?: ResponsivePropValue<GridItemPlacement>;
}

interface _GridItemElementProps extends BoxLikeElementProps, _GridItemPlacementProps {}

interface _GridItemRenderProps extends BoxLikeRenderProps, _GridItemPlacementProps {}

/** Props for `GridItem`. */
export type GridItemProps = Prettify<_GridItemElementProps | _GridItemRenderProps>;

/**
 * Places a child in its parent `Grid` by area, column, or row. Compose it with `Box` or another
 * layout component through `renderRoot` to style the item without an extra element.
 */
export function GridItem({
	area,
	className,
	column,
	row,
	style,
	...props
}: GridItemProps): JSX.Element {
	const placement = createSprinkles({ gridArea: area, gridColumn: column, gridRow: row });

	return <Box {...props} {...mergeProps(placement, { className, style })} />;
}

import type { JSX } from 'react';
import { Box, omitUnsupportedSprinklesProps } from '../box/box.js';
import type { LayoutProps } from '../styles/layout-props.js';
import { layoutProperties } from '../styles/layout-props.js';
import type { BoxLikeElementProps, BoxLikeRenderProps } from '../types/box-like-props.js';
import type { Prettify } from '../types/prettify.js';
import { aspectRatioRecipe } from './recipe.css.js';

/** Props for `AspectRatio`. */
export type AspectRatioProps = Prettify<_AspectRatioElementProps | _AspectRatioRenderProps>;

/**
 * Locks a media frame to an inline-to-block ratio and sizes its direct child to fill the frame.
 * Use it for an `iframe`, `img`, or `video`.
 */
export function AspectRatio({
	className,
	objectFit = 'cover',
	ratio = '1 / 1',
	...props
}: AspectRatioProps): JSX.Element {
	return (
		<Box
			{...omitUnsupportedSprinklesProps(props, layoutProperties)}
			className={aspectRatioRecipe({ className, objectFit, ratio })}
		/>
	);
}

interface _AspectRatioLayoutProps {
	/**
	 * How replaced media fits inside the filled frame.
	 * @default cover
	 */
	objectFit?: AspectRatioObjectFit;
	/**
	 * Inline-to-block ratio of the frame.
	 * @default "1 / 1"
	 */
	ratio?: AspectRatio;
}

interface _AspectRatioElementProps
	extends BoxLikeElementProps, LayoutProps, _AspectRatioLayoutProps {}

interface _AspectRatioRenderProps
	extends BoxLikeRenderProps, LayoutProps, _AspectRatioLayoutProps {}

type AspectRatio = '1 / 1' | '4 / 3' | '3 / 2' | '16 / 9' | '21 / 9';

type AspectRatioObjectFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';

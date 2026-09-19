import type { HTMLAttributes, JSX, ReactNode, Ref } from 'react';
import { Box } from '../box/box.js';
import type { RequiredInitialResponsive } from '../styles/responsive.js';
import type { SprinklesProps } from '../styles/utilities.css.js';
import type { Prettify } from '../types/prettify.js';
import type { TrackRecipeVariants } from './recipe.css.js';
import { trackRecipe } from './recipe.css.js';

type TrackElementType = 'div' | 'li' | 'span';

type TrackWrapperElementType = 'div' | 'span';

interface _TrackProps extends HTMLAttributes<HTMLElement> {
	/** Content that uses the remaining inline space. */
	children?: ReactNode;
	/**
	 * Root element.
	 *
	 * Use `li` as a direct child of `ul` or `ol`. Use `span` when Track needs to remain inside phrasing
	 * content.
	 * @default div
	 */
	elementType?: TrackElementType;
	/** Space between each rendered rail and `children`. */
	gap?: RequiredInitialResponsive<SprinklesProps['gap']>;
	/** Content shown after `children` that keeps its intrinsic inline size. */
	railEnd?: ReactNode;
	/**
	 * Cross-axis alignment of the rails.
	 *
	 * `firstLine` uses Track's inherited line height. A different line height inside `children` does
	 * not change the alignment point.
	 * @default start
	 */
	railAlignment?: NonNullable<TrackRecipeVariants>['railAlignment'];
	/** Content shown before `children` that keeps its intrinsic inline size. */
	railStart?: ReactNode;
	/** Ref to the rendered element. */
	ref?: Ref<HTMLElement>;
}

/** Props for `Track`. */
export type TrackProps = Prettify<_TrackProps>;

/** Aligns optional rails with flexible content on the inline axis. */
export function Track(props: TrackProps): JSX.Element {
	const {
		children,
		className,
		elementType: Element = 'div',
		gap,
		railAlignment = 'start',
		railEnd,
		railStart,
		ref,
		...elementProps
	} = props;

	const WrapperElement: TrackWrapperElementType = Element === 'span' ? 'span' : 'div';
	const { centre, rail, root } = trackRecipe({ isInline: Element === 'span', railAlignment });

	return (
		<Box
			{...elementProps}
			className={root({ className })}
			elementType={Element}
			gap={gap}
			ref={ref}
		>
			{railStart != null && <WrapperElement className={rail()}>{railStart}</WrapperElement>}
			<WrapperElement className={centre()}>{children}</WrapperElement>
			{railEnd != null && <WrapperElement className={rail()}>{railEnd}</WrapperElement>}
		</Box>
	);
}

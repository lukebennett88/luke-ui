import type { HTMLAttributes, JSX, ReactNode, Ref } from 'react';
import { Box } from '../box/box.js';
import type { RequiredInitialResponsive } from '../styles/responsive.js';
import type { SprinklesProps } from '../styles/utilities.css.js';
import type { Prettify } from '../types/prettify.js';
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
	/** Content shown before `children` that keeps its intrinsic inline size. */
	railStart?: ReactNode;
	/** Ref to the rendered element. */
	ref?: Ref<HTMLElement>;
}

/** Props for `Track`. */
export type TrackProps = Prettify<_TrackProps>;

/**
 * Aligns optional rails with flexible content on the inline axis. Each rail is centred on the first
 * line of `children`.
 */
export function Track(props: TrackProps): JSX.Element {
	const {
		children,
		className,
		elementType: Element = 'div',
		gap,
		railEnd,
		railStart,
		ref,
		...elementProps
	} = props;

	const WrapperElement: TrackWrapperElementType = Element === 'span' ? 'span' : 'div';
	const { centre, rail, root } = trackRecipe({ isInline: Element === 'span' });

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

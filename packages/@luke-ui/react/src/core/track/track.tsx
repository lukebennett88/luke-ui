import type { HTMLAttributes, JSX, ReactNode, Ref } from 'react';
import { mergeStyleProps } from '../../shared/utils/utils.js';
import { createSprinkles } from '../styles/utilities.css.js';
import type { SprinklesProps } from '../styles/utilities.css.js';
import type { Prettify } from '../types/prettify.js';
import type { TrackRecipeVariants } from './recipe.css.js';
import { trackRecipe } from './recipe.css.js';

type TrackElementType = 'div' | 'li' | 'span';

type TrackWrapperElementType = 'div' | 'span';

interface _TrackProps extends HTMLAttributes<HTMLElement> {
	/** Flexible centre content. */
	children?: ReactNode;
	/**
	 * Root element.
	 *
	 * `li` is intended as a direct child of `ul` or `ol`. `span` keeps the root and wrappers inline so
	 * the component can flow inside a sentence.
	 * @default div
	 */
	elementType?: TrackElementType;
	/**
	 * Space between rails and the centre. Omitted rails do not add a gap.
	 */
	gap: NonNullable<SprinklesProps['gap']>;
	/** Content shown after the centre. */
	railEnd?: ReactNode;
	/**
	 * Cross-axis alignment of the rails.
	 *
	 * `firstLine` uses Track's inherited line-height (`1lh`), not the rendered line-height of centre
	 * children.
	 * @default start
	 */
	railAlignment?: NonNullable<TrackRecipeVariants>['railAlignment'];
	/** Content shown before the centre. */
	railStart?: ReactNode;
	/** Ref to the rendered element. */
	ref?: Ref<HTMLElement>;
}

/** Props for `Track`. */
export type TrackProps = Prettify<_TrackProps>;

/**
 * Lays out optional rails around flexible inline content.
 */
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
	const gapSprinkles = createSprinkles({ gap });

	return (
		<Element
			{...mergeStyleProps(gapSprinkles, { ...elementProps, className: root({ className }) })}
			ref={toCallbackRef(ref)}
		>
			{railStart != null && <WrapperElement className={rail()}>{railStart}</WrapperElement>}
			<WrapperElement className={centre()}>{children}</WrapperElement>
			{railEnd != null && <WrapperElement className={rail()}>{railEnd}</WrapperElement>}
		</Element>
	);
}

/** Normalises Track's `ref` so it can spread onto a concrete element narrower than `HTMLElement`. */
function toCallbackRef(ref: Ref<HTMLElement> | undefined): (element: HTMLElement | null) => void {
	return (element) => {
		if (typeof ref === 'function') return ref(element);
		if (ref) ref.current = element;
	};
}

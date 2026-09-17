import type { HTMLAttributes, JSX, ReactNode, Ref } from 'react';
import { mergeStyleProps } from '../../shared/utils/utils.js';
import { createSprinkles } from '../styles/utilities.css.js';
import type { SprinklesProps } from '../styles/utilities.css.js';
import type { Prettify } from '../types/prettify.js';
import type { TrackRecipeVariants } from './recipe.css.js';
import { trackRecipe } from './recipe.css.js';

type TrackElementType = 'div' | 'li' | 'span';

/** The element a `Track` internal wrapper (rail or centre) renders as. */
type TrackWrapperElementType = 'div' | 'span';

interface _TrackProps extends HTMLAttributes<HTMLElement> {
	/** The flexible centre. Shrinks below its content's inline size so it never forces overflow. */
	children?: ReactNode;
	/**
	 * Chooses a supported structural element.
	 *
	 * `li` renders as a direct child of `ul` or `ol`; its internal rail and centre wrappers still
	 * render as `div`. `span` renders every internal wrapper as `span` too and makes the root an
	 * inline-level box, so the whole component stays safe inside phrasing content and flows inside a
	 * sentence.
	 * @default div
	 */
	elementType?: TrackElementType;
	/**
	 * Space between the rails and the centre on the inline axis. An omitted rail's wrapper does not
	 * render, so it contributes no gap. Pass `"0"` when content should touch.
	 */
	gap: NonNullable<SprinklesProps['gap']>;
	/**
	 * Content shown after the centre. Does not shrink below its own content size.
	 */
	railEnd?: ReactNode;
	/**
	 * Cross-axis alignment of the rails against Track's block box.
	 *
	 * `firstLine` centres each rail against the line-height Track itself inherits, not the actual
	 * rendered line-height of the centre's children — a `Heading` or larger `Text` in the centre
	 * does not move where the rail sits.
	 * @default start
	 */
	railAlignment?: NonNullable<TrackRecipeVariants>['railAlignment'];
	/**
	 * Content shown before the centre. Does not shrink below its own content size.
	 */
	railStart?: ReactNode;
	/** Ref to the rendered element. */
	ref?: Ref<HTMLElement>;
}

/** Props for `Track`. */
export type TrackProps = Prettify<_TrackProps>;

/**
 * Lays out an optional fixed rail, a flexible centre, and an optional fixed rail on the inline
 * axis. Use it for a row that pairs adornments with content that can wrap or truncate, such as an
 * icon and an action beside an address.
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

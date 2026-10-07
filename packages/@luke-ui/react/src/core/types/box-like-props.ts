import type { HTMLAttributes, JSX, ReactElement, Ref } from 'react';
import type { UseRenderRef } from '../use-render/use-render.js';
import type { DistributiveOmit } from './distributive-omit.js';

/** Structural elements a Box-like component may render. */
type BoxLikeElementType = keyof Pick<
	JSX.IntrinsicElements,
	| 'article'
	| 'aside'
	| 'dd'
	| 'div'
	| 'dl'
	| 'dt'
	| 'figcaption'
	| 'figure'
	| 'footer'
	| 'header'
	| 'li'
	| 'main'
	| 'nav'
	| 'ol'
	| 'section'
	| 'span'
	| 'ul'
>;

/** Props a Box-like component accepts when it renders a structural element itself. */
export interface BoxLikeElementProps extends HTMLAttributes<HTMLElement> {
	/**
	 * Chooses a supported structural element.
	 * @default div
	 */
	elementType?: BoxLikeElementType;
	/** Ref to the rendered element. */
	ref?: Ref<HTMLElement>;
	/** Use `renderRoot` instead of `elementType` to own the rendered element. */
	renderRoot?: never;
}

/** Content and presentation props a Box-like component passes through to its element. */
interface BoxLikePresentationProps extends Pick<
	HTMLAttributes<HTMLElement>,
	'children' | 'className' | 'style'
> {
	ref?: Ref<HTMLElement>;
}

/** Props a Box-like component hands to a caller-owned `renderRoot` element. */
type BoxLikeResolvedRenderProps = DistributiveOmit<BoxLikePresentationProps, 'ref'> & {
	ref: UseRenderRef;
};

/** Props a Box-like component accepts when a caller owns the rendered element. */
export interface BoxLikeRenderProps extends BoxLikePresentationProps {
	/** Use `elementType` instead of `renderRoot` for a supported structural element. */
	elementType?: never;
	/**
	 * Passes resolved `children`, `className`, `style`, and a callback `ref` as `domProps`.
	 * The second argument is an empty state object.
	 * Put DOM attributes on the element the callback returns.
	 */
	renderRoot: (
		domProps: {
			[K in keyof BoxLikeResolvedRenderProps]: BoxLikeResolvedRenderProps[K];
		},
		state: Record<string, never>,
	) => ReactElement;
}

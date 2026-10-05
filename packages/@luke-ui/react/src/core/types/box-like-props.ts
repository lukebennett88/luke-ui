import type { CSSProperties, HTMLAttributes, JSX, ReactElement, Ref, RefObject } from 'react';

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

/** Ref shape a Box-like component hands to `renderRoot`, spreadable onto a concrete element. */
export type BoxLikeRef = NonNullable<Exclude<Ref<HTMLElement>, RefObject<HTMLElement | null>>>;

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

/**
 * Resolved root props a Box-like component hands to `renderRoot` after sprinkles merge.
 *
 * `className` and `style` are always present: sprinkles emits them, and absent consumer
 * presentation does not clear them.
 */
export type BoxLikeResolvedRenderProps = Omit<
	HTMLAttributes<HTMLElement>,
	'className' | 'ref' | 'style'
> & {
	className: string;
	ref: BoxLikeRef;
	style: CSSProperties;
};

/** Curated render state for Box-like roots. Box-like roots have no interactive state today. */
export type BoxLikeRenderState = Record<string, never>;

/** Props a Box-like component accepts when a caller owns the rendered element. */
export interface BoxLikeRenderProps extends HTMLAttributes<HTMLElement> {
	/** Use `elementType` instead of `renderRoot` for a supported structural element. */
	elementType?: never;
	/** Ref to the rendered element. Normalised to a callback ref in `renderRoot` props. */
	ref?: Ref<HTMLElement>;
	/**
	 * Passes the component's resolved root props to a caller-owned element.
	 * Receives the same accepted DOM props the element path would apply, plus resolved
	 * `children`, `className`, and `style`, and a callback `ref`.
	 */
	renderRoot: (props: BoxLikeResolvedRenderProps, state: BoxLikeRenderState) => ReactElement;
}

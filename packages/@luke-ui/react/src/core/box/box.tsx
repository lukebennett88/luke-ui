import type { HTMLAttributes, JSX, ReactElement, Ref, RefObject } from 'react';
import { mergeStyleProps } from '../../shared/utils/utils.js';
import type { SprinklesProps } from '../styles/utilities.css.js';
import { createSprinkles } from '../styles/utilities.css.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';

/** Props for `Box`. */
export type BoxProps = Prettify<_BoxElementProps | _BoxRenderProps>;

/** Applies layout properties to a supported structural element or an element returned by `render`. */
export function Box(props: BoxProps): JSX.Element {
	// `ref` is left out of this destructure and read via `restProps.ref` below: the
	// compiler only tracks a ref through a named binding, and bails out of memoising
	// Box if it sees one destructured or passed on.
	const { children, className, elementType = 'div', render, style, ...restProps } = props;

	if (render) {
		const renderProps = mergeStyleProps(createSprinkles(retainSprinklesProps(restProps)), {
			children,
			className,
			style,
		});

		// The render owner must receive Box's ref with its presentation props.
		return render({ ...renderProps, ref: toCallbackRef(restProps.ref) });
	}

	const Element = elementType;
	// `restProps` still carries `ref`; createSprinkles passes unknown keys through
	// unchanged, so it reaches the element without being named here. `normaliseRef`
	// swaps it for a callback: a `RefObject<HTMLElement>` can't spread onto a
	// narrower concrete element (`current` is invariant), but a callback ref can.
	const domProps = mergeStyleProps(createSprinkles(normaliseRef(restProps)), {
		children,
		className,
		style,
	});
	return <Element {...domProps} />;
}

type BoxElementType = keyof Pick<
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

interface _BoxElementProps extends HTMLAttributes<HTMLElement>, SprinklesProps {
	/**
	 * Chooses a supported structural element.
	 * @default div
	 */
	elementType?: BoxElementType;
	/** Ref to the rendered element. */
	ref?: Ref<HTMLElement>;
	/** Use `render` instead of `elementType` to own the rendered element. */
	render?: never;
}

interface _BoxPresentationProps
	extends Pick<HTMLAttributes<HTMLElement>, 'children' | 'className' | 'style'>, SprinklesProps {
	ref?: Ref<HTMLElement>;
}

type BoxRef = NonNullable<Exclude<Ref<HTMLElement>, RefObject<HTMLElement | null>>>;

type _BoxResolvedRenderProps = DistributiveOmit<
	_BoxPresentationProps,
	'ref' | keyof SprinklesProps
> & {
	ref: BoxRef;
};

interface _BoxRenderProps extends _BoxPresentationProps {
	/** Use `elementType` instead of `render` for a supported structural element. */
	elementType?: never;
	/** Passes Box's content and presentation props to a caller-owned element. */
	render: (props: {
		[K in keyof _BoxResolvedRenderProps]: _BoxResolvedRenderProps[K];
	}) => ReactElement;
}

/** Normalises Box's `ref` so `render` can spread it onto a concrete element. */
function toCallbackRef(ref: Ref<HTMLElement> | undefined): BoxRef {
	return (element) => {
		if (typeof ref === 'function') return ref(element);
		if (ref) ref.current = element;
	};
}

/** Replaces `props.ref` with a callback ref so the result can spread onto a concrete element. */
function normaliseRef<Props extends { ref?: Ref<HTMLElement> }>(
	props: Props,
): Omit<Props, 'ref'> & { ref: BoxRef } {
	return { ...props, ref: toCallbackRef(props.ref) };
}

const sprinklesProperties: ReadonlySet<PropertyKey> = createSprinkles.properties;

function retainSprinklesProps<Props extends object>(props: Props): Props {
	const sprinklesProps = { ...props };

	for (const key of Reflect.ownKeys(sprinklesProps)) {
		if (!sprinklesProperties.has(key)) {
			Reflect.deleteProperty(sprinklesProps, key);
		}
	}

	return sprinklesProps;
}

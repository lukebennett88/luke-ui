import type { HTMLAttributes, JSX, ReactElement, Ref, RefCallback } from 'react';
import { mergeProps } from '../../shared/utils/utils.js';
import type { SprinklesProps } from '../styles/utilities.css.js';
import { createSprinkles } from '../styles/utilities.css.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';

/** Props for `Box`. */
export type BoxProps = Prettify<_BoxElementProps | _BoxRenderProps>;

/** Applies layout properties to a supported structural element or an element returned by `render`. */
export function Box(props: BoxProps): JSX.Element {
	const { children, className, elementType = 'div', ref, render, style, ...restProps } = props;
	const callbackRef: RefCallback<HTMLElement> = (element) => {
		if (typeof ref === 'function') return ref(element);
		if (ref) ref.current = element;
	};

	if (render) {
		const renderProps = mergeProps(createSprinkles(retainSprinklesProps(restProps)), {
			children,
			className,
			style,
		});

		// The render owner must receive Box's ref with its presentation props.
		// oxlint-disable-next-line react/refs
		return render({ ...renderProps, ref: callbackRef });
	}

	const Element = elementType;
	const domProps = mergeProps(createSprinkles(restProps), { children, className, style });
	return <Element {...domProps} ref={callbackRef} />;
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

type _BoxResolvedRenderProps = DistributiveOmit<
	_BoxPresentationProps,
	'ref' | keyof SprinklesProps
> & {
	ref: RefCallback<HTMLElement>;
};

interface _BoxRenderProps extends _BoxPresentationProps {
	/** Use `elementType` instead of `render` for a supported structural element. */
	elementType?: never;
	/** Passes Box's content and presentation props to a caller-owned element. */
	render: (props: {
		[K in keyof _BoxResolvedRenderProps]: _BoxResolvedRenderProps[K];
	}) => ReactElement;
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

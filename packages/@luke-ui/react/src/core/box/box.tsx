import type { JSX } from 'react';
import { mergeProps } from '../../shared/utils/merge-props.js';
import type { SprinklesProps } from '../styles/utilities.css.js';
import { createSprinkles } from '../styles/utilities.css.js';
import type { BoxLikeElementProps, BoxLikeRenderProps } from '../types/box-like-props.js';
import type { Prettify } from '../types/prettify.js';
import { useRender } from '../use-render/use-render.js';

interface _BoxElementProps extends BoxLikeElementProps, SprinklesProps {}

interface _BoxRenderProps extends BoxLikeRenderProps, SprinklesProps {}

/** Props for `Box`. */
export type BoxProps = Prettify<_BoxElementProps | _BoxRenderProps>;

/** Applies layout properties to a supported structural element or an element returned by `renderRoot`. */
export function Box(props: BoxProps): JSX.Element {
	// `ref` is left out of this destructure and read via `restProps.ref` below: the
	// compiler only tracks a ref through a named binding, and bails out of memoising
	// Box if it sees one destructured or passed on.
	const { children, className, elementType, renderRoot, style, ...restProps } = props;

	const sprinklesProps = renderRoot ? retainSprinklesProps(restProps) : restProps;

	const resolvedProps = mergeProps(createSprinkles(sprinklesProps), {
		children,
		className,
		style,
	});

	return useRender({
		defaultElementType: 'div',
		elementType,
		props: resolvedProps,
		ref: restProps.ref,
		renderRoot,
		state: {},
	});
}

const sprinklesProperties: ReadonlySet<PropertyKey> = createSprinkles.properties;

/** Removes unsupported utility props while preserving structural and DOM props. */
export function omitUnsupportedSprinklesProps<Props extends object>(
	props: Props,
	supportedProperties: ReadonlySet<PropertyKey>,
): Props {
	const nextProps: Record<PropertyKey, unknown> = {};

	for (const key of Reflect.ownKeys(props)) {
		if (!sprinklesProperties.has(key) || supportedProperties.has(key)) {
			nextProps[key] = props[key as keyof Props];
		}
	}

	return nextProps as Props;
}

function retainSprinklesProps<Props extends object>(props: Props): Props {
	const nextProps: Record<PropertyKey, unknown> = {};

	for (const key of Reflect.ownKeys(props)) {
		if (sprinklesProperties.has(key)) {
			nextProps[key] = props[key as keyof Props];
		}
	}

	return nextProps as Props;
}

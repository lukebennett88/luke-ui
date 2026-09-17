import type { JSX, Ref } from 'react';
import { mergeStyleProps } from '../../shared/utils/utils.js';
import type { SprinklesProps } from '../styles/utilities.css.js';
import { createSprinkles } from '../styles/utilities.css.js';
import type {
	BoxLikeElementProps,
	BoxLikeRef,
	BoxLikeRenderProps,
} from '../types/box-like-props.js';
import type { Prettify } from '../types/prettify.js';

/** Props for `Box`. */
export type BoxProps = Prettify<_BoxElementProps | _BoxRenderProps>;

/** Applies layout properties to a supported structural element or an element returned by `render`. */
export function Box(props: BoxProps): JSX.Element {
	// `ref` is left out of this destructure and read via `restProps.ref` below: the
	// compiler only tracks a ref through a named binding, and bails out of memoising
	// Box if it sees one destructured or passed on.
	const { children, className, elementType: Element = 'div', render, style, ...restProps } = props;

	if (render) {
		const renderProps = mergeStyleProps(createSprinkles(retainSprinklesProps(restProps)), {
			children,
			className,
			style,
		});

		// The render owner must receive Box's ref with its presentation props.
		return render({ ...renderProps, ref: toCallbackRef(restProps.ref) });
	}

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

interface _BoxElementProps extends BoxLikeElementProps, SprinklesProps {}

interface _BoxRenderProps extends BoxLikeRenderProps, SprinklesProps {}

/** Normalises Box's `ref` so `render` can spread it onto a concrete element. */
function toCallbackRef(ref: Ref<HTMLElement> | undefined): BoxLikeRef {
	return (element) => {
		if (typeof ref === 'function') return ref(element);
		if (ref) ref.current = element;
	};
}

/** Replaces `props.ref` with a callback ref so the result can spread onto a concrete element. */
function normaliseRef<Props extends { ref?: Ref<HTMLElement> }>(
	props: Props,
): Omit<Props, 'ref'> & { ref: BoxLikeRef } {
	return { ...props, ref: toCallbackRef(props.ref) };
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

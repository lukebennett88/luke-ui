import { createElement } from 'react';
import type { JSX, ReactElement, Ref, RefObject } from 'react';

/** Callback ref shape handed to `renderRoot`, spreadable onto a concrete element. */
export type UseRenderRef = NonNullable<Exclude<Ref<HTMLElement>, RefObject<HTMLElement | null>>>;

/** Normalises a ref so `renderRoot` and intrinsic elements can share one callback. */
function toCallbackRef(ref: Ref<HTMLElement> | undefined): UseRenderRef {
	return (element) => {
		if (typeof ref === 'function') return ref(element);
		if (ref) ref.current = element;
	};
}

type UseRenderOptions<
	Tag extends keyof JSX.IntrinsicElements,
	State extends object,
	Props extends object,
> = {
	/** Element rendered when `elementType` and `renderRoot` are omitted. */
	defaultElementType: Tag;
	/** Bounded semantic element when the component owns the root. */
	elementType?: Tag;
	/** Resolved DOM and presentation props for the root, without `ref`. */
	props: Props;
	/** Consumer ref for the rendered root. */
	ref?: Ref<HTMLElement>;
	/**
	 * Caller-owned root. Receives resolved props plus a callback `ref`, and the component's public
	 * render state. Pass `{}` when there is no meaningful public state.
	 */
	renderRoot?: (domProps: Props & { ref: UseRenderRef }, state: State) => ReactElement;
	/** Public render state. Use `{}` when the component has none. */
	state: State;
};

/**
 * Renders a bounded `elementType` root or a caller-owned `renderRoot` element with a shared
 * callback-ref contract.
 */
export function useRender<
	Tag extends keyof JSX.IntrinsicElements,
	State extends object,
	Props extends object,
>(options: UseRenderOptions<Tag, State, Props>): ReactElement {
	const domProps = { ...options.props, ref: toCallbackRef(options.ref) };

	if (options.renderRoot) {
		return options.renderRoot(domProps, options.state);
	}

	return createElement(options.elementType ?? options.defaultElementType, domProps);
}

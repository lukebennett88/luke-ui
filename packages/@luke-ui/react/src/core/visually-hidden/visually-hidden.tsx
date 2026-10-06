import type { CSSProperties, HTMLAttributes, JSX, ReactElement, ReactNode, Ref } from 'react';
import { mergeProps } from '../../shared/utils/merge-props.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { useRender, type UseRenderRef } from '../use-render/use-render.js';
import { useVisuallyHidden } from './use-visually-hidden.js';

/** Elements `VisuallyHidden` may render when it owns the root. */
type VisuallyHiddenElementType = keyof Pick<
	JSX.IntrinsicElements,
	'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label' | 'p' | 'span'
>;

/** Presentation props `VisuallyHidden` always owns on its root. */
interface VisuallyHiddenPresentationProps {
	/** Content kept available to assistive technology while visually hidden. */
	children?: ReactNode;
	/** Class name on the stable owned root. Remains applied while focus visibility changes. */
	className?: string;
	/**
	 * When true, remove the visually-hidden treatment while focus is within the root or a
	 * descendant. Does not make anything focusable.
	 * @default false
	 */
	isFocusable?: boolean;
	/** Ref to the rendered root. */
	ref?: Ref<HTMLElement>;
	/** Style on the stable owned root. Wins over the hiding styles when both apply. */
	style?: CSSProperties;
}

/** Props when `VisuallyHidden` renders a supported element itself. */
interface VisuallyHiddenElementProps
	extends
		DistributiveOmit<HTMLAttributes<HTMLElement>, 'children' | 'className' | 'style'>,
		VisuallyHiddenPresentationProps {
	/**
	 * Chooses a supported semantic element.
	 * @default 'span'
	 */
	elementType?: VisuallyHiddenElementType;
	/** Use `renderRoot` instead of `elementType` to own the rendered element. */
	renderRoot?: never;
}

/** Resolved props handed to a caller-owned `renderRoot` element. */
type VisuallyHiddenResolvedRenderProps = DistributiveOmit<
	VisuallyHiddenPresentationProps,
	'ref'
> & {
	ref: UseRenderRef;
};

/** Props when a caller owns the rendered element. */
interface VisuallyHiddenRenderProps extends VisuallyHiddenPresentationProps {
	/** Use `elementType` instead of `renderRoot` for a supported semantic element. */
	elementType?: never;
	/**
	 * Passes resolved `children`, `className`, `style`, focus-within handlers, and a callback `ref`
	 * as `domProps`. The second argument is an empty state object. Put element-specific DOM
	 * attributes on the element the callback returns.
	 */
	renderRoot: (
		domProps: {
			[K in keyof VisuallyHiddenResolvedRenderProps]: VisuallyHiddenResolvedRenderProps[K];
		} & Pick<HTMLAttributes<HTMLElement>, 'onBlur' | 'onFocus'>,
		state: Record<string, never>,
	) => ReactElement;
}

/** Props for `VisuallyHidden`. */
export type VisuallyHiddenProps = Prettify<VisuallyHiddenElementProps | VisuallyHiddenRenderProps>;

/**
 * Hides its content visually while keeping it available to assistive technology.
 */
export function VisuallyHidden(props: VisuallyHiddenProps): JSX.Element {
	// `ref` is read via `restProps.ref` so the compiler can still memoise this component.
	const {
		children,
		className,
		elementType,
		isFocusable = false,
		renderRoot,
		style,
		...restProps
	} = props;
	const { visuallyHiddenProps } = useVisuallyHidden({ isFocusable, style });

	const resolvedProps = renderRoot
		? mergeProps({ children, className }, visuallyHiddenProps)
		: mergeProps(omitRef(restProps), { children, className }, visuallyHiddenProps);

	return useRender({
		defaultElementType: 'span',
		elementType,
		props: resolvedProps,
		ref: restProps.ref,
		renderRoot,
		state: {},
	});
}

function omitRef<Props extends { ref?: Ref<HTMLElement> }>(props: Props): Omit<Props, 'ref'> {
	const { ref: _ref, ...rest } = props;
	return rest;
}

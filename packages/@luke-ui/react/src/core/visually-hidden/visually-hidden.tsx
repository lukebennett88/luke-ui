import type {
	CSSProperties,
	DOMAttributes,
	HTMLAttributes,
	JSX,
	ReactElement,
	ReactNode,
	Ref,
} from 'react';
import { mergeProps } from '../../shared/utils/merge-props.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import type { UseRenderRef } from '../use-render/use-render.js';
import { useRender } from '../use-render/use-render.js';
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
	/** Style on the stable owned root. Wins over the hiding styles when both apply. */
	style?: CSSProperties;
}

interface VisuallyHiddenBaseProps extends VisuallyHiddenPresentationProps {
	/**
	 * When true, remove the visually-hidden treatment while focus is within the root or a
	 * descendant. Does not make anything focusable.
	 * @default false
	 */
	isFocusable?: boolean;
	/** Ref to the rendered root. */
	ref?: Ref<HTMLElement>;
}

type _VisuallyHiddenElementOmit = DistributiveOmit<
	HTMLAttributes<HTMLElement>,
	'children' | 'className' | 'slot' | 'style'
>;

/** Props when `VisuallyHidden` renders a supported element itself. */
interface VisuallyHiddenElementProps extends _VisuallyHiddenElementOmit, VisuallyHiddenBaseProps {
	/**
	 * Chooses a supported semantic element.
	 * @default 'span'
	 */
	elementType?: VisuallyHiddenElementType;
	/** Use `renderRoot` instead of `elementType` to own the rendered element. */
	renderRoot?: never;
}

/** Resolved props handed to a caller-owned `renderRoot` element. */
interface VisuallyHiddenResolvedRenderProps
	extends VisuallyHiddenPresentationProps, Pick<DOMAttributes<Element>, 'onBlur' | 'onFocus'> {
	ref: UseRenderRef;
}

/** Props when a caller owns the rendered element. */
interface VisuallyHiddenRenderProps extends VisuallyHiddenBaseProps {
	/** Use `elementType` instead of `renderRoot` for a supported semantic element. */
	elementType?: never;
	/**
	 * Passes resolved `children`, `className`, `style`, focus-within handlers, and a callback `ref`
	 * as `domProps`. The second argument is an empty state object. Put element-specific DOM
	 * attributes on the element the callback returns.
	 */
	renderRoot: (
		domProps: VisuallyHiddenResolvedRenderProps,
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

import { assignInlineVars } from '@vanilla-extract/dynamic';
import type { HTMLAttributes, JSX, ReactNode, Ref } from 'react';
import { createContext, isValidElement, useContext } from 'react';
import { cx } from '../../shared/utils/utils.js';
import { vars } from '../../theme/contract.css.js';
import type { Prettify } from '../types/prettify.js';
import { useSynchronizeAnimations } from '../use-synchronize-animations/use-synchronize-animations.js';
import {
	loadingSkeletonClassName,
	skeletonAnimationName,
	skeletonRadiusVar,
} from './styles.css.js';

const LoadingSkeletonContext = createContext<boolean | null>(null);

/** Supported native elements for the loading skeleton overlay. */
type LoadingSkeletonElementType = 'div' | 'li' | 'span';

/** Props for `LoadingSkeletonProvider`. */
export interface LoadingSkeletonProviderProps {
	children: ReactNode;
	/** Default loading state for descendant `LoadingSkeleton` components without an `isLoading` prop. */
	isLoading: boolean;
}

/** Provides a shared loading state to descendant `LoadingSkeleton` components. */
export function LoadingSkeletonProvider(props: LoadingSkeletonProviderProps): JSX.Element {
	const { children, isLoading } = props;
	return (
		<LoadingSkeletonContext.Provider value={isLoading}>{children}</LoadingSkeletonContext.Provider>
	);
}

interface _LoadingSkeletonProps extends HTMLAttributes<HTMLElement> {
	/**
	 * Element rendered while loading.
	 * @default 'span'
	 */
	elementType?: LoadingSkeletonElementType;
	/**
	 * Whether the skeleton is shown in place of `children`. Overrides a `LoadingSkeletonProvider` ancestor.
	 * @default true
	 */
	isLoading?: boolean;
	/**
	 * Sets the semantic corner radius of the skeleton overlay. Use when the wrapped child has no
	 * radius of its own but a visual descendant does (e.g. wrapping a `TextInputField`).
	 */
	radius?: keyof typeof vars.radius;
	/** Ref to the rendered skeleton element. */
	ref?: Ref<HTMLElement>;
}

/** Props for `LoadingSkeleton`. */
export type LoadingSkeletonProps = Prettify<_LoadingSkeletonProps>;

/**
 * Placeholder that mirrors the layout of loading content. Wrap text for an inline skeleton sized to the text, or
 * wrap a component to paint a skeleton over it while preserving its footprint. All skeletons sheen in sync.
 */
export function LoadingSkeleton(props: LoadingSkeletonProps): ReactNode {
	const {
		elementType: Component = 'span',
		children,
		className,
		isLoading: isLoadingProp,
		radius,
		ref,
		style,
		...elementProps
	} = props;

	const isLoadingContext = useContext(LoadingSkeletonContext);
	const isLoading = isLoadingProp ?? isLoadingContext ?? true;

	useSynchronizeAnimations(isLoading ? skeletonAnimationName : null);

	if (!isLoading) return children;

	// Inline mode for text and other non-element children; block mode wraps a rendered component.
	const isInline = !isValidElement(children);

	return (
		<Component
			{...elementProps}
			aria-hidden
			className={cx(loadingSkeletonClassName, className)}
			data-skeleton-inline={isInline ? '' : undefined}
			inert
			ref={toCallbackRef(ref)}
			style={
				radius
					? { ...assignInlineVars({ [skeletonRadiusVar]: vars.radius[radius] }), ...style }
					: style
			}
			tabIndex={-1}
		>
			{children}
		</Component>
	);
}

/** Callback ref so `div` | `span` can accept an `HTMLElement` ref without RefObject variance issues. */
function toCallbackRef(ref: Ref<HTMLElement> | undefined) {
	return (element: HTMLElement | null) => {
		if (typeof ref === 'function') return ref(element);
		if (ref) ref.current = element;
	};
}

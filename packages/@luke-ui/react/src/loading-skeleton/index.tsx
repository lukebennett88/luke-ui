import type { ComponentProps, ElementType, JSX, ReactNode } from 'react';
import { createContext, isValidElement, useContext } from 'react';
import * as styles from '../recipes/loading-skeleton.css.js';
import { vars } from '../theme/contract.css.js';
import { useSynchronizeAnimations } from '../use-synchronize-animations/use-synchronize-animations.js';
import { cx } from '../utils/index.js';

const LoadingSkeletonContext = createContext<boolean | null>(null);

/** Props for `LoadingSkeletonProvider`. */
export interface LoadingSkeletonProviderProps {
	children: ReactNode;
	/** Loading state applied to every descendant `LoadingSkeleton`, overriding their `isLoading` prop. */
	isLoading: boolean;
}

/** Provides a shared loading state to descendant `LoadingSkeleton` components. */
export function LoadingSkeletonProvider(props: LoadingSkeletonProviderProps): JSX.Element {
	const { children, isLoading } = props;
	return (
		<LoadingSkeletonContext.Provider value={isLoading}>{children}</LoadingSkeletonContext.Provider>
	);
}

/**
 * Props for `LoadingSkeleton`.
 *
 * @tier atom
 */
export interface LoadingSkeletonProps extends ComponentProps<'span'> {
	/**
	 * Element rendered while loading.
	 * @default 'span'
	 */
	as?: ElementType;
	/**
	 * Sets the semantic corner radius of the skeleton overlay. Use when the wrapped child has no
	 * radius of its own but a visual descendant does (e.g. wrapping a `TextField`).
	 */
	radius?: keyof typeof vars.radius;
	/**
	 * Whether the skeleton is shown in place of `children`. Overridden by a `LoadingSkeletonProvider` ancestor.
	 * @default true
	 */
	isLoading?: boolean;
}

/**
 * Placeholder that mirrors the layout of loading content. Wrap text for an inline skeleton sized to the text, or
 * wrap a component to paint a skeleton over it while preserving its footprint. All skeletons pulse in sync.
 */
export function LoadingSkeleton(props: LoadingSkeletonProps): ReactNode {
	const {
		as: Component = 'span',
		children,
		className,
		isLoading: isLoadingProp,
		radius,
		style,
		...spanProps
	} = props;

	const isLoadingContext = useContext(LoadingSkeletonContext);
	const isLoading = isLoadingContext ?? isLoadingProp ?? true;

	useSynchronizeAnimations(isLoading ? styles.skeletonAnimationName : null);

	if (!isLoading) return children;

	// Inline mode for text and other non-element children; block mode wraps a rendered component.
	const isInline = !isValidElement(children);

	return (
		<Component
			{...spanProps}
			aria-hidden
			className={cx(styles.loadingSkeleton, className)}
			data-skeleton-inline={isInline ? '' : undefined}
			inert
			style={radius ? { ...style, [styles.skeletonRadiusVar]: vars.radius[radius] } : style}
			tabIndex={-1}
		>
			{children}
		</Component>
	);
}

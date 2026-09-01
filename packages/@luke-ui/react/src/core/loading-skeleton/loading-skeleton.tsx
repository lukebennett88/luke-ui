import * as stylex from '@stylexjs/stylex';
import type { ComponentProps, ElementType, JSX, ReactNode } from 'react';
import { createContext, isValidElement, useContext } from 'react';
import { cx } from '../../shared/utils/utils.js';
import { tokens } from '../../theme/tokens.stylex.js';
import type { XStyleProp } from '../styles/xstyle.js';
import { resolveXStyleProps } from '../styles/xstyle.js';
import type { Prettify } from '../types/prettify.js';
import { useSynchronizeAnimations } from '../use-synchronize-animations/use-synchronize-animations.js';

const loadingSkeletonScopeClassName = 'loading-skeleton';
const skeletonRadiusVar = '--luke-loading-skeleton-radius';
const skeletonPulseAnimationName = 'luke-loading-skeleton-pulse';

const loadingSkeletonStyles = stylex.create({
	root: {
		':not([data-skeleton-inline])': {
			display: 'contents',
		},
		'[data-skeleton-inline]': {
			animationDelay: '0.5s',
			animationDuration: '2s',
			animationIterationCount: 'infinite',
			animationName: skeletonPulseAnimationName,
			animationTimingFunction: tokens.motionEasingStandard,
			backgroundClip: 'border-box !important',
			backgroundColor: 'var(--luke-color-loading-skeleton) !important',
			backgroundImage: 'none !important',
			border: 'none !important',
			borderRadius: 'var(--luke-loading-skeleton-radius, var(--luke-radius-detail))',
			boxDecorationBreak: 'clone !important',
			boxShadow: 'none !important',
			color: 'transparent !important',
			cursor: 'default !important',
			outline: 'none !important',
			pointerEvents: 'none !important',
			userSelect: 'none !important',
			'@media (forced-colors: active)': {
				animationName: 'none',
				backgroundColor: 'CanvasText !important',
				forcedColorAdjust: 'none !important',
			},
			'@media (prefers-reduced-motion: reduce)': {
				animationName: 'none',
			},
		},
	},
}).root;

const LoadingSkeletonContext = createContext<boolean | null>(null);

const skeletonRadiusTokens = {
	control: tokens.radiusControl,
	detail: tokens.radiusDetail,
	full: tokens.radiusFull,
	overlay: tokens.radiusOverlay,
	surface: tokens.radiusSurface,
} as const;

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

interface _LoadingSkeletonProps extends ComponentProps<'span'> {
	/**
	 * Element rendered while loading.
	 * @default 'span'
	 */
	elementType?: ElementType;
	/**
	 * Whether the skeleton is shown in place of `children`. Overridden by a `LoadingSkeletonProvider` ancestor.
	 * @default true
	 */
	isLoading?: boolean;
	/**
	 * Sets the semantic corner radius of the skeleton overlay. Use when the wrapped child has no
	 * radius of its own but a visual descendant does (e.g. wrapping a `TextField`).
	 */
	radius?: keyof typeof skeletonRadiusTokens;
	/**
	 * Extra styles as one or more `stylex.create(...)` objects. Applied after `LoadingSkeleton`'s own
	 * styles and before `className`. A same-property `xstyle` value wins over those styles. A
	 * consumer `className` still beats `xstyle`, and inline `style` beats `className`.
	 */
	xstyle?: XStyleProp;
}

/** Props for `LoadingSkeleton`. */
export type LoadingSkeletonProps = Prettify<_LoadingSkeletonProps>;

/**
 * Placeholder that mirrors the layout of loading content. Wrap text for an inline skeleton sized to the text, or
 * wrap a component to paint a skeleton over it while preserving its footprint. All skeletons pulse in sync.
 */
export function LoadingSkeleton(props: LoadingSkeletonProps): ReactNode {
	const {
		elementType: Component = 'span',
		children,
		className,
		isLoading: isLoadingProp,
		radius,
		style,
		xstyle,
		...spanProps
	} = props;

	const isLoadingContext = useContext(LoadingSkeletonContext);
	const isLoading = isLoadingContext ?? isLoadingProp ?? true;

	useSynchronizeAnimations(isLoading ? skeletonPulseAnimationName : null);

	if (!isLoading) return children;

	// Inline mode for text and other non-element children; block mode wraps a rendered component.
	const isInline = !isValidElement(children);
	const stylexProps = resolveXStyleProps([loadingSkeletonStyles], xstyle, className, {
		...(radius === undefined ? {} : { [skeletonRadiusVar]: skeletonRadiusTokens[radius] }),
		...style,
	});

	return (
		<Component
			{...spanProps}
			{...stylexProps}
			aria-hidden
			className={cx(loadingSkeletonScopeClassName, stylexProps.className)}
			data-skeleton-inline={isInline ? '' : undefined}
			inert
			tabIndex={-1}
		>
			{children}
		</Component>
	);
}

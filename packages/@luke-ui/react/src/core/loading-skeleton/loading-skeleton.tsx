import * as stylex from '@stylexjs/stylex';
import type { ComponentProps, ElementType, JSX, ReactNode } from 'react';
import { createContext, isValidElement, useContext } from 'react';
import { vars } from '../../theme/tokens.stylex.js';
import type { XStyleProps } from '../styles/xstyle.js';
import { resolveXStyleProps } from '../styles/xstyle.js';
import type { Prettify } from '../types/prettify.js';
import { useSynchronizeAnimations } from '../use-synchronize-animations/use-synchronize-animations.js';
import {
	loadingSkeletonScopeAttribute,
	skeletonPulseAnimationName,
	skeletonRadiusVar,
} from './scope.js';

// Only ordinary, non-`!important` styling lives here. The forced `!important` surface (background,
// border, color, cursor, pointer-events, user-select, forced-colors override) and the pulse
// animation itself are retained CSS in `styles.css.ts`, applied directly to this same
// `[data-skeleton-inline]` root via the shared `loadingSkeletonScopeAttribute` — see that file's
// `surface`/`pulse` comment for why `!important` cannot live in a StyleX `recipes.priorityN`
// sublayer here. `borderRadius` and `display` stay in StyleX because they're ordinary
// declarations with no need to out-rank anything.
const loadingSkeletonStyles = stylex.create({
	root: {
		':not([data-skeleton-inline])': {
			display: 'contents',
		},
		'[data-skeleton-inline]': {
			borderRadius: 'var(--luke-loading-skeleton-radius, var(--luke-radius-detail))',
		},
	},
}).root;

const LoadingSkeletonContext = createContext<boolean | null>(null);

const skeletonRadiusTokens = {
	control: vars.radius.control,
	detail: vars.radius.detail,
	full: vars.radius.full,
	overlay: vars.radius.overlay,
	surface: vars.radius.surface,
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

interface _LoadingSkeletonProps extends ComponentProps<'span'>, XStyleProps {
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
			{...{ [loadingSkeletonScopeAttribute]: '' }}
			data-skeleton-inline={isInline ? '' : undefined}
			inert
			tabIndex={-1}
		>
			{children}
		</Component>
	);
}

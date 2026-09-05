import type { ComponentProps, ReactNode } from 'react';
import { useId } from 'react';
import { cx } from '../../shared/utils/utils.js';
import { useIconSizeContext } from '../icon/icon-size-context.js';
import {
	ICON_VIEWBOX,
	ICON_VIEWBOX_SIZE,
	SPINNER_CIRCLE_RADIUS,
	SPINNER_STROKE_WIDTH,
} from '../sizing/icon-sizing.js';
import type { XStyleProp } from '../styles/xstyle.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { useSynchronizeAnimations } from '../use-synchronize-animations/use-synchronize-animations.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import type { LoadingSpinnerRecipeVariants } from './recipe.js';
import { loadingSpinnerRecipe, rubberBandAnimationName, spinAnimationName } from './recipe.js';

interface LoadingSpinnerVariantProps extends NonNullable<LoadingSpinnerRecipeVariants> {}

interface LoadingSpinnerStyleProps {
	/** Sets a semantic content color. Omit to inherit the surrounding content color. */
	color?: LoadingSpinnerVariantProps['color'];
	/**
	 * Sets the spinner size.
	 * @default 'medium'
	 */
	size?: LoadingSpinnerVariantProps['size'];
	/** Extra `stylex.create(...)` styles for the spinner, applied after variants and before `className`. */
	xstyle?: XStyleProp;
}

type _LoadingSpinnerOmit = DistributiveOmit<
	ComponentProps<'span'>,
	'color' | 'role' | 'aria-label'
>;

interface _LoadingSpinnerProps extends _LoadingSpinnerOmit, LoadingSpinnerStyleProps {
	/**
	 * Accessible name for the loading status region.
	 * @default 'loading'
	 */
	'aria-label'?: ComponentProps<'span'>['aria-label'];
	/** Content to show once loading finishes. While loading, the spinner replaces it in place. */
	children?: ReactNode;
	/**
	 * Whether the spinner is shown in place of `children`.
	 * @default true
	 */
	isLoading?: boolean;
}

/** Props for `LoadingSpinner`. */
export type LoadingSpinnerProps = Prettify<_LoadingSpinnerProps>;

/** Animated spinner shown while work is in progress. Wrap content in it to show the spinner in place of that content until loading finishes. */
export function LoadingSpinner(props: LoadingSpinnerProps): ReactNode {
	const {
		'aria-label': ariaLabel = 'loading',
		children,
		className,
		color,
		isLoading = true,
		size,
		style,
		xstyle,
		...spanProps
	} = props;

	const contextSize = useIconSizeContext();
	const resolvedSize = size ?? contextSize ?? 'medium';

	if (!isLoading) return children;

	const spinnerElement = (
		<SpinnerElement
			{...spanProps}
			aria-label={ariaLabel}
			className={className}
			color={color}
			size={resolvedSize}
			style={style}
			xstyle={xstyle}
		/>
	);

	if (!children) return spinnerElement;

	const parts = loadingSpinnerRecipe();

	return (
		<span {...parts.childrenWrapper}>
			<span aria-hidden {...parts.hiddenChildren} inert>
				{children}
			</span>
			<span {...parts.spinnerOverlay}>{spinnerElement}</span>
		</span>
	);
}

type SpinnerElementProps = DistributiveOmit<LoadingSpinnerProps, 'children' | 'isLoading'>;

function SpinnerElement({
	'aria-label': ariaLabel,
	className,
	color,
	size,
	style,
	xstyle,
	...spanProps
}: SpinnerElementProps) {
	useSynchronizeAnimations(spinAnimationName);
	useSynchronizeAnimations(rubberBandAnimationName);

	const labelId = useId();
	const parts = loadingSpinnerRecipe({ color, size, xstyle: { root: xstyle } });
	const viewBoxCenter = ICON_VIEWBOX_SIZE / 2;

	return (
		<span
			{...spanProps}
			{...parts.root}
			aria-labelledby={labelId}
			className={cx(parts.root.className, className)}
			role="status"
			style={parts.root.style === undefined ? style : { ...parts.root.style, ...style }}
		>
			<VisuallyHidden id={labelId}>{ariaLabel}</VisuallyHidden>
			<svg {...parts.svg} aria-hidden="true" fill="none" viewBox={ICON_VIEWBOX}>
				<circle
					{...parts.indicator}
					cx={viewBoxCenter}
					cy={viewBoxCenter}
					fill="none"
					pathLength={100}
					r={SPINNER_CIRCLE_RADIUS}
					stroke="currentColor"
					strokeWidth={SPINNER_STROKE_WIDTH}
				/>
			</svg>
		</span>
	);
}

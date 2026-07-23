import type { ComponentProps, ReactNode } from 'react';
import { useId } from 'react';
import { useIconSizeContext } from '../icon-size-context/index.js';
import * as styles from '../recipes/loading-spinner.css.js';
import {
	ICON_VIEWBOX,
	ICON_VIEWBOX_SIZE,
	SPINNER_CIRCLE_RADIUS,
	SPINNER_STROKE_WIDTH,
} from '../sizing/icon-sizing.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { useSynchronizeAnimations } from '../use-synchronize-animations/use-synchronize-animations.js';
import { VisuallyHidden } from '../visually-hidden/index.js';

interface LoadingSpinnerVariantProps extends NonNullable<styles.LoadingSpinnerVariants> {}

interface LoadingSpinnerStyleProps {
	/** Sets a semantic content color. Omit to inherit the surrounding content color. */
	color?: LoadingSpinnerVariantProps['color'];
	/** Sets the spinner size. */
	size?: LoadingSpinnerVariantProps['size'];
}

type _LoadingSpinnerOmit = DistributiveOmit<ComponentProps<'span'>, 'color' | 'role'>;

interface _LoadingSpinnerProps extends _LoadingSpinnerOmit, LoadingSpinnerStyleProps {
	/** Content to show once loading finishes. While loading, the spinner replaces it in place. */
	children?: ReactNode;
	/**
	 * Whether the spinner is shown in place of `children`.
	 * @default true
	 */
	isLoading?: boolean;
}

/**
 * Props for `LoadingSpinner`.
 *
 * @tier atom
 */
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
		...spanProps
	} = props;

	const contextSize = useIconSizeContext();
	const resolvedSize = size ?? contextSize ?? 'medium';

	if (!isLoading) return children;

	const spinnerElement = (
		<SpinnerElement
			{...spanProps}
			aria-label={ariaLabel}
			color={color}
			size={resolvedSize}
			className={className}
			style={style}
		/>
	);

	if (!children) return spinnerElement;

	const slots = styles.loadingSpinner();

	return (
		<span className={slots.childrenWrapper()}>
			<span aria-hidden className={slots.hiddenChildren()} inert>
				{children}
			</span>
			<span className={slots.spinnerOverlay()}>{spinnerElement}</span>
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
	...spanProps
}: SpinnerElementProps) {
	useSynchronizeAnimations(styles.spinAnimationName);
	useSynchronizeAnimations(styles.rubberBandAnimationName);

	const labelId = useId();
	const slots = styles.loadingSpinner({ color, size });
	const viewBoxCenter = ICON_VIEWBOX_SIZE / 2;

	return (
		<span
			{...spanProps}
			aria-labelledby={labelId}
			className={slots.root(className)}
			role="status"
			style={style}
		>
			<VisuallyHidden id={labelId}>{ariaLabel}</VisuallyHidden>
			<svg aria-hidden="true" className={slots.svg()} fill="none" viewBox={ICON_VIEWBOX}>
				<circle
					className={slots.indicator()}
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

import { clamp } from '@react-aria/utils';
import type { ComponentProps } from 'react';
import * as styles from '../recipes/loading-spinner.css.js';
import {
	ICON_VIEWBOX,
	ICON_VIEWBOX_SIZE,
	SPINNER_CIRCLE_RADIUS,
	SPINNER_STROKE_WIDTH,
} from '../sizing/icon-sizing.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import { cx } from '../utils/index.js';

interface LoadingSpinnerVariantProps extends NonNullable<styles.LoadingSpinnerVariants> {}

interface LoadingSpinnerStyleProps {
	/** Sets the spinner color. */
	color?: LoadingSpinnerVariantProps['color'];
	/** Sets the spinner size. */
	size?: LoadingSpinnerVariantProps['size'];
}

/**
 * Props for `LoadingSpinner`.
 *
 * @tier atom
 */
export type LoadingSpinnerProps = DistributiveOmit<
	ComponentProps<'div'>,
	'aria-valuemax' | 'aria-valuemin' | 'aria-valuenow' | 'color' | 'role'
> &
	LoadingSpinnerStyleProps & {
		/**
		 * Max value for determinate mode.
		 * @default 100
		 */
		maxValue?: number;
		/**
		 * Min value for determinate mode.
		 * @default 0
		 */
		minValue?: number;
		/** Current value. Omit for indeterminate mode. */
		value?: number;
	};

/** Progress spinner for determinate or indeterminate loading state. */
export function LoadingSpinner(props: LoadingSpinnerProps) {
	const {
		'aria-label': ariaLabel = 'pending',
		className,
		color,
		maxValue = 100,
		minValue = 0,
		size,
		style,
		value,
		...divProps
	} = props;

	const hasValue = value !== undefined && value !== null;
	const normalizedMin = Math.min(minValue, maxValue);
	const normalizedMax = Math.max(minValue, maxValue);
	const clampedRange = Math.max(normalizedMax - normalizedMin, 1);
	const clampedValue = hasValue ? clamp(value, normalizedMin, normalizedMax) : 0;
	const progress = ((clampedValue - normalizedMin) / clampedRange) * 100;
	const dashOffset = 100 - progress;
	const mode = hasValue ? 'determinate' : 'indeterminate';

	return (
		<div
			{...divProps}
			aria-label={ariaLabel}
			aria-valuemax={maxValue}
			aria-valuemin={minValue}
			aria-valuenow={hasValue ? clampedValue : undefined}
			className={cx(styles.spinner({ color, size }), styles.spinnerState({ mode }), className)}
			role="progressbar"
			style={style}
		>
			<svg aria-hidden="true" className={styles.svg()} fill="none" viewBox={ICON_VIEWBOX}>
				<circle
					className={styles.indicator({ mode })}
					cx={ICON_VIEWBOX_SIZE / 2}
					cy={ICON_VIEWBOX_SIZE / 2}
					fill="none"
					pathLength={100}
					r={SPINNER_CIRCLE_RADIUS}
					stroke="currentColor"
					strokeWidth={SPINNER_STROKE_WIDTH}
					strokeDashoffset={hasValue ? dashOffset : undefined}
				/>
			</svg>
		</div>
	);
}

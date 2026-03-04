import { clamp } from '@react-aria/utils';
import type { ComponentProps } from 'react';
import {
	ICON_VIEWBOX,
	ICON_VIEWBOX_SIZE,
	SPINNER_CIRCLE_RADIUS,
	SPINNER_STROKE_WIDTH,
} from '../../../lib/icon.js';
import * as styles from '../../../recipes/loading-spinner.css.js';
import type { DistributiveOmit } from '../../../types.js';
import { cx } from '../../../utils.js';

interface LoadingSpinnerVariantProps extends NonNullable<styles.LoadingSpinnerVariants> {}

export type LoadingSpinnerProps = DistributiveOmit<
	ComponentProps<'div'>,
	'aria-valuemax' | 'aria-valuemin' | 'aria-valuenow' | 'color' | 'role'
> &
	LoadingSpinnerVariantProps & {
		maxValue?: number;
		minValue?: number;
		value?: number;
	};

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

	return (
		<div
			{...divProps}
			aria-label={ariaLabel}
			aria-valuemax={maxValue}
			aria-valuemin={minValue}
			aria-valuenow={hasValue ? clampedValue : undefined}
			className={cx(
				styles.spinner({ color, size }),
				!hasValue && styles.spinnerIndeterminate,
				className,
			)}
			role="progressbar"
			style={style}
		>
			<svg aria-hidden="true" className={styles.svg} fill="none" viewBox={ICON_VIEWBOX}>
				<circle
					className={cx(
						styles.indicator,
						hasValue ? styles.indicatorDeterminate : styles.indicatorIndeterminate,
					)}
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

import type { JSX, ReactNode } from 'react';
import { LoadingSpinner } from '../loading-spinner/index.js';
import * as styles from '../recipes/button-composed.css.js';
import type * as primitiveStyles from '../recipes/button.css.js';
import type { DocumentedPressProps } from '../types/documented-rac-props.js';
import type { ButtonProps as PrimitiveButtonProps } from './primitive/index.js';
import { Button as PrimitiveButton } from './primitive/index.js';

interface ComposedButtonVariantProps extends NonNullable<styles.ButtonLabelVariants> {}

interface PrimitiveButtonVariantProps extends NonNullable<primitiveStyles.ButtonVariants> {}

interface ButtonStyleProps {
	/**
	 * Icon shown after the label.
	 */
	endIcon?: ReactNode;
	/**
	 * Whether the button takes up the full inline size of its container.
	 * @default false
	 */
	isBlock?: PrimitiveButtonVariantProps['isBlock'];
	/**
	 * Shows pending button styles. When true, a spinner overlays the label.
	 * @default false
	 */
	isPending?: ComposedButtonVariantProps['isPending'];
	/**
	 * Sets the button size.
	 * @default 'medium'
	 */
	size?: PrimitiveButtonVariantProps['size'];
	/**
	 * Icon shown before the label.
	 */
	startIcon?: ReactNode;
	/**
	 * Visual tone. Controls colour scheme.
	 * @default 'accent'
	 */
	tone?: PrimitiveButtonVariantProps['tone'];
	/** Visual emphasis. @default 'solid' */
	variant?: PrimitiveButtonVariantProps['variant'];
}

/**
 * Composed button with size, tone, pending, and block variants.
 *
 * @tier composed
 */
export interface ButtonProps
	extends
		Omit<PrimitiveButtonProps, keyof ButtonStyleProps | keyof DocumentedPressProps>,
		ButtonStyleProps,
		DocumentedPressProps {}

/** Composed button. Wraps children in a `Text` for ellipsis truncation. Shows a spinner when `isPending`. */
export function Button(props: ButtonProps): JSX.Element {
	const { children, endIcon, isPending, size = 'medium', startIcon, ...restProps } = props;

	return (
		<PrimitiveButton {...restProps} isPending={isPending} size={size}>
			{(renderProps) => (
				<span className={styles.buttonContent()}>
					{isPending && (
						<span aria-hidden className={styles.spinnerOverlay()}>
							<LoadingSpinner aria-hidden />
						</span>
					)}
					<span className={styles.buttonLabel({ isPending })}>
						{startIcon}
						<span className={styles.labelText()}>
							{typeof children === 'function' ? children(renderProps) : children}
						</span>
						{endIcon}
					</span>
				</span>
			)}
		</PrimitiveButton>
	);
}

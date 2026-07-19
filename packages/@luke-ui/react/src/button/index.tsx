import type { JSX, ReactNode } from 'react';
import { LoadingSpinner } from '../loading-spinner/index.js';
import * as styles from '../recipes/button-composed.js';
import type * as primitiveStyles from '../recipes/button.js';
import { Text } from '../text/index.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { DocumentedPressProps } from '../types/documented-rac-props.js';
import type { Prettify } from '../types/prettify.js';
import type { ButtonProps as PrimitiveButtonProps } from './primitive/index.js';
import { Button as PrimitiveButton } from './primitive/index.js';

type ComposedButtonRecipeProps = NonNullable<styles.ButtonComposedVariants>;

interface PrimitiveButtonRecipeProps extends NonNullable<primitiveStyles.ButtonVariants> {}

interface ButtonStyleProps {
	/**
	 * Visual emphasis.
	 * @default 'solid'
	 */
	appearance?: PrimitiveButtonRecipeProps['appearance'];
	/**
	 * Icon shown after the label.
	 */
	endIcon?: ReactNode;
	/**
	 * Whether the button takes up the full inline size of its container.
	 * @default false
	 */
	isBlock?: PrimitiveButtonRecipeProps['isBlock'];
	/**
	 * Shows pending button styles. When true, a spinner overlays the label.
	 * @default false
	 */
	isPending?: ComposedButtonRecipeProps['isPending'];
	/**
	 * Sets the button size.
	 * @default 'medium'
	 */
	size?: PrimitiveButtonRecipeProps['size'];
	/**
	 * Icon shown before the label.
	 */
	startIcon?: ReactNode;
	/**
	 * Visual tone. Controls colour scheme.
	 * @default 'neutral'
	 */
	tone?: PrimitiveButtonRecipeProps['tone'];
}

type _ButtonOmit = DistributiveOmit<
	PrimitiveButtonProps,
	'appearance' | 'isBlock' | 'isPending' | 'size' | 'tone' | keyof DocumentedPressProps
>;

interface _ButtonProps extends _ButtonOmit, ButtonStyleProps, DocumentedPressProps {}

/**
 * Composed button with size, tone, appearance, pending, and block options.
 *
 * @tier composed
 */
export type ButtonProps = Prettify<_ButtonProps>;

/** Composed button. Wraps children in a `Text` for ellipsis truncation. Shows a spinner when `isPending`. */
export function Button(props: ButtonProps): JSX.Element {
	const { children, endIcon, isPending, size = 'medium', startIcon, ...restProps } = props;
	const buttonComposedStyles = styles.buttonComposed({ isPending });

	return (
		<PrimitiveButton {...restProps} isPending={isPending} size={size}>
			{(renderProps) => (
				<span className={buttonComposedStyles.content}>
					{isPending && (
						<span aria-hidden className={buttonComposedStyles.spinnerOverlay}>
							<LoadingSpinner aria-hidden />
						</span>
					)}
					<span className={buttonComposedStyles.label}>
						{startIcon}
						<Text elementType="span" lineClamp shouldInheritFont>
							{typeof children === 'function' ? children(renderProps) : children}
						</Text>
						{endIcon}
					</span>
				</span>
			)}
		</PrimitiveButton>
	);
}

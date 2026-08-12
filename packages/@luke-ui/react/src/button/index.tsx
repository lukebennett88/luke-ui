export { buttonRecipe, type ButtonRecipeVariants } from '../primitives/button/recipe.css.js';
import type { JSX, ReactNode } from 'react';
import * as styles from '../button/styles.css.js';
import { LoadingSpinner } from '../loading-spinner/index.js';
import type { ButtonProps as PrimitiveButtonProps } from '../primitives/button/index.js';
import { Button as PrimitiveButton } from '../primitives/button/index.js';
import type * as primitiveStyles from '../primitives/button/recipe.css.js';
import { Text } from '../text/index.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { DocumentedPressProps } from '../types/documented-rac-props.js';
import type { Prettify } from '../types/prettify.js';

interface ButtonLabelRecipeProps extends NonNullable<styles.ButtonLabelVariants> {}

interface PrimitiveButtonRecipeProps extends NonNullable<primitiveStyles.ButtonRecipeVariants> {}

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
	isPending?: ButtonLabelRecipeProps['isPending'];
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

/** Props for `Button`. */
export type ButtonProps = Prettify<_ButtonProps>;

/**
 * Button with size, tone, appearance, pending, and block options.
 * Wraps children in a `Text` for ellipsis truncation. Shows a spinner when `isPending`.
 */
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

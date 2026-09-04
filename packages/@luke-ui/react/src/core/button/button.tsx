import type { JSX, ReactNode } from 'react';
import { LoadingSpinner } from '../loading-spinner/loading-spinner.js';
import type { ButtonProps as PrimitiveButtonProps } from '../primitives/button/button.js';
import { Button as PrimitiveButton } from '../primitives/button/button.js';
import type { ButtonRecipeVariants as PrimitiveButtonRecipeVariants } from '../primitives/button/recipe.js';
import type { XStyleProps } from '../styles/xstyle.js';
import { Text } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { DocumentedPressProps } from '../types/documented-rac-props.js';
import type { Prettify } from '../types/prettify.js';
import type { ButtonLabelVariants } from './styles.js';
import { buttonContent, buttonLabel, spinnerOverlay } from './styles.js';

interface ButtonLabelRecipeProps extends NonNullable<ButtonLabelVariants> {}

interface PrimitiveButtonRecipeProps extends NonNullable<PrimitiveButtonRecipeVariants> {}

interface ButtonStyleProps extends XStyleProps {
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
	'appearance' | 'isBlock' | 'isPending' | 'size' | 'tone' | 'xstyle' | keyof DocumentedPressProps
>;

interface _ButtonProps extends _ButtonOmit, ButtonStyleProps, DocumentedPressProps {}

/** Props for `Button`. */
export type ButtonProps = Prettify<_ButtonProps>;

/**
 * Button with size, tone, appearance, pending, and block options.
 * Wraps children in a `Text` for ellipsis truncation. Shows a spinner when `isPending`.
 */
export function Button(props: ButtonProps): JSX.Element {
	const { children, endIcon, isPending, size = 'medium', startIcon, xstyle, ...restProps } = props;

	return (
		<PrimitiveButton {...restProps} isPending={isPending} size={size} xstyle={xstyle}>
			{(renderProps) => (
				<span {...buttonContent()}>
					{isPending && (
						<span aria-hidden {...spinnerOverlay()}>
							<LoadingSpinner aria-hidden />
						</span>
					)}
					<span {...buttonLabel({ isPending })}>
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

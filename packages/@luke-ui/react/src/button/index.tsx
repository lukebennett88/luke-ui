import type { JSX } from 'react';
import type { ButtonProps as PrimitiveButtonProps } from '../button/primitive.js';
import { Button as PrimitiveButton } from '../button/primitive.js';
import { LoadingSpinner } from '../loading-spinner/index.js';
import * as styles from '../recipes/button-composed.css.js';
import type * as primitiveStyles from '../recipes/button.css.js';
import { BUTTON_FONT_SIZE, BUTTON_ICON_SIZE } from '../sizing/button-sizing.js';
import { Text } from '../text/index.js';

interface ComposedButtonVariantProps extends NonNullable<styles.ButtonLabelVariants> {}

interface PrimitiveButtonVariantProps extends NonNullable<primitiveStyles.ButtonVariants> {}

interface ButtonStyleProps {
	/** Shows pending button styles. */
	isPending?: ComposedButtonVariantProps['isPending'];
	/** Sets the button size. */
	size?: PrimitiveButtonVariantProps['size'];
}

/** Props for the composed `Button`. */
export interface ButtonProps
	extends Omit<PrimitiveButtonProps, keyof ButtonStyleProps>, ButtonStyleProps {}

/** Button with composed label and pending spinner styles. */
export function Button(props: ButtonProps): JSX.Element {
	const { children, isPending, size = 'medium', ...restProps } = props;

	return (
		<PrimitiveButton {...restProps} isPending={isPending} size={size}>
			{(renderProps) => (
				<span className={styles.buttonContent()}>
					{isPending && (
						<span className={styles.spinnerOverlay()} aria-hidden>
							<LoadingSpinner aria-hidden size={BUTTON_ICON_SIZE[size]} />
						</span>
					)}
					<Text
						className={styles.buttonLabel({ isPending })}
						color="inherit"
						fontSize={BUTTON_FONT_SIZE[size]}
						fontWeight="inherit"
						lineHeight="nospace"
						shouldDisableTrim
						lineClamp={1}
					>
						{typeof children === 'function' ? children(renderProps) : children}
					</Text>
				</span>
			)}
		</PrimitiveButton>
	);
}

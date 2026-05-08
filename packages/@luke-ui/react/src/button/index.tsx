import type { JSX } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components/Button';
import { LoadingSpinner } from '../loading-spinner/index.js';
import * as styles from '../recipes/button-composed.css.js';
import type * as primitiveStyles from '../recipes/button.css.js';
import { BUTTON_FONT_SIZE, BUTTON_ICON_SIZE } from '../sizing/button-sizing.js';
import { Text } from '../text/index.js';
import type { ButtonProps as PrimitiveButtonProps } from './primitive/index.js';
import { Button as PrimitiveButton } from './primitive/index.js';

interface ComposedButtonVariantProps extends NonNullable<styles.ButtonLabelVariants> {}

interface PrimitiveButtonVariantProps extends NonNullable<primitiveStyles.ButtonVariants> {}

interface ButtonStyleProps {
	/**
	 * Visual tone. Controls colour scheme.
	 * @default 'primary'
	 */
	tone?: PrimitiveButtonVariantProps['tone'];
	/**
	 * Sets the button size.
	 * @default 'medium'
	 */
	size?: PrimitiveButtonVariantProps['size'];
	/**
	 * Shows pending button styles. When true, a spinner overlays the label.
	 * @default false
	 */
	isPending?: ComposedButtonVariantProps['isPending'];
	/**
	 * Whether the button takes up the full inline size of its container.
	 * @default false
	 */
	isBlock?: PrimitiveButtonVariantProps['isBlock'];
}

interface ButtonRedeclaredRACProps {
	/**
	 * Whether the button is disabled. Disabled buttons can't be focused or pressed.
	 * @default false
	 */
	isDisabled?: RacButtonProps['isDisabled'];
	/** Press handler. Called on click, Enter, or Space. */
	onPress?: RacButtonProps['onPress'];
	/** HTML button type. */
	type?: RacButtonProps['type'];
}

/**
 * Composed button with size, tone, pending, and block variants.
 *
 * @tier composed
 */
export interface ButtonProps
	extends
		Omit<PrimitiveButtonProps, keyof ButtonStyleProps | keyof ButtonRedeclaredRACProps>,
		ButtonStyleProps,
		ButtonRedeclaredRACProps {}

/** Composed button. Wraps children in a `Text` for ellipsis truncation; shows a spinner when `isPending`. */
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

import type { JSX } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components/Button';
import { Button as RacButton } from 'react-aria-components/Button';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { IconSizeProvider } from '../../icon-size-context/index.js';
import * as styles from '../../recipes/button.css.js';
import { BUTTON_ICON_SIZE } from '../../sizing/button-sizing.js';
import { cx } from '../../utils/index.js';

interface ButtonVariantProps extends NonNullable<styles.ButtonVariants> {}

interface ButtonStyleProps {
	/**
	 * Whether the button takes up the full inline size of its container.
	 * @default false
	 */
	isBlock?: ButtonVariantProps['isBlock'];
	/**
	 * Sets the button size.
	 * @default 'medium'
	 */
	size?: ButtonVariantProps['size'];
	/** Visual tone. Controls colour scheme. */
	tone?: ButtonVariantProps['tone'];
}

/**
 * Primitive button — a bare `<button>` styled with size, tone, and block variants.
 * Library-author audience: use this when you need full control over children layout.
 *
 * @tier primitive
 */
export interface ButtonProps
	extends Omit<RacButtonProps, keyof ButtonStyleProps>, ButtonStyleProps {}

/** Primitive button. See `ButtonProps`. */
export function Button(props: ButtonProps): JSX.Element {
	const {
		children,
		isBlock = false,
		isDisabled = false,
		isPending = false,
		size = 'medium',
		tone,
		...restProps
	} = props;
	const iconSize = BUTTON_ICON_SIZE[size];

	return (
		<IconSizeProvider size={iconSize}>
			<RacButton
				{...restProps}
				className={composeRenderProps(props.className, (className) => {
					return cx(styles.button({ isBlock, size, tone }), className);
				})}
				isDisabled={isDisabled || isPending}
				isPending={isPending}
			>
				{children}
			</RacButton>
		</IconSizeProvider>
	);
}

import type { JSX } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components/Button';
import { Button as RacButton } from 'react-aria-components/Button';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { IconSizeProvider } from '../../icon-size-context/index.js';
import * as styles from '../../recipes/button.css.js';
import { BUTTON_ICON_SIZE } from '../../sizing/button-sizing.js';
import type { Prettify } from '../../types/prettify.js';
import { cx } from '../../utils/index.js';

interface ButtonRecipeProps extends NonNullable<styles.ButtonVariants> {}

interface ButtonStyleProps {
	/**
	 * Visual emphasis.
	 * @default 'solid'
	 */
	appearance?: ButtonRecipeProps['appearance'];
	/**
	 * Whether the button takes up the full inline size of its container.
	 * @default false
	 */
	isBlock?: ButtonRecipeProps['isBlock'];
	/**
	 * Sets the button size.
	 * @default 'medium'
	 */
	size?: ButtonRecipeProps['size'];
	/**
	 * Visual tone. Controls colour scheme.
	 * @default 'neutral'
	 */
	tone?: ButtonRecipeProps['tone'];
}

interface _ButtonProps extends RacButtonProps, ButtonStyleProps {}

/**
 * Primitive button — a bare `<button>` styled with size, tone, appearance, and block options.
 * Library-author audience: use this when you need full control over children layout.
 *
 * @tier primitive
 */
export type ButtonProps = Prettify<_ButtonProps>;

/** Primitive button. See `ButtonProps`. */
export function Button(props: ButtonProps): JSX.Element {
	const {
		appearance = 'solid',
		children,
		isBlock = false,
		isDisabled = false,
		isPending = false,
		size = 'medium',
		tone = 'neutral',
		...restProps
	} = props;
	const iconSize = BUTTON_ICON_SIZE[size];

	return (
		<IconSizeProvider size={iconSize}>
			<RacButton
				{...restProps}
				className={composeRenderProps(props.className, (className) => {
					return cx(styles.button({ appearance, isBlock, size, tone }), className);
				})}
				isDisabled={isDisabled}
				isPending={isPending}
			>
				{children}
			</RacButton>
		</IconSizeProvider>
	);
}

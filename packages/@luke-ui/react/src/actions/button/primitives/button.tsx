import type { JSX } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components/Button';
import { Button as RacButton } from 'react-aria-components/Button';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { BUTTON_ICON_SIZE } from '../../../lib/button.js';
import * as styles from '../../../recipes/button.css.js';
import { cx } from '../../../utils.js';
import { IconSizeProvider } from '../../../visuals/icon/primitives/icon-size-context.js';

interface ButtonVariantProps extends NonNullable<styles.ButtonVariants> {}

interface ButtonStyleProps {
	/** Makes the button full width. */
	isBlock?: ButtonVariantProps['isBlock'];
	/** Sets the button size. */
	size?: ButtonVariantProps['size'];
	/** Sets the button tone. */
	tone?: ButtonVariantProps['tone'];
}

/** Props for the primitive button. */
export interface ButtonProps
	extends Omit<RacButtonProps, keyof ButtonStyleProps>, ButtonStyleProps {}

/** Base button with styles and icon sizing context. */
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

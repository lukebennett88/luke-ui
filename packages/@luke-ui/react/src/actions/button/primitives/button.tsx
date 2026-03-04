import type { JSX } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components';
import { composeRenderProps, Button as RacButton } from 'react-aria-components';
import { BUTTON_ICON_SIZE } from '../../../lib/button.js';
import * as styles from '../../../recipes/button.css.js';
import { cx } from '../../../utils.js';
import { IconSizeProvider } from '../../../visuals/icon/primitives/icon-size-context.js';

interface ButtonVariantProps extends NonNullable<styles.ButtonVariants> {}

/** Props for the primitive button. */
export interface ButtonProps extends RacButtonProps, ButtonVariantProps {}

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

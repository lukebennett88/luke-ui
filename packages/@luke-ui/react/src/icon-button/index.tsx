import type { JSX } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components/Button';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import type { ButtonProps as PrimitiveButtonProps } from '../button/primitive/index.js';
import { Button } from '../button/primitive/index.js';
import type { IconName } from '../icon/index.js';
import { Icon } from '../icon/index.js';
import * as styles from '../recipes/icon-button.css.js';
import { cx } from '../utils/index.js';

interface IconButtonVariantProps extends NonNullable<styles.IconButtonVariants> {}

interface IconButtonStyleProps {
	/**
	 * Sets the button size.
	 * @default 'medium'
	 */
	size?: IconButtonVariantProps['size'];
}

interface IconButtonRedeclaredRACProps {
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
 * Props for `IconButton`.
 *
 * @tier composed
 */
export interface IconButtonProps
	extends
		Omit<PrimitiveButtonProps, keyof IconButtonStyleProps | keyof IconButtonRedeclaredRACProps>,
		IconButtonStyleProps,
		IconButtonRedeclaredRACProps {
	/** Icon name from the generated icon set. */
	icon: IconName;
}

/** Button that renders only an icon. */
export function IconButton(props: IconButtonProps): JSX.Element {
	const { icon, size = 'medium', ...buttonProps } = props;

	return (
		<Button
			{...buttonProps}
			className={composeRenderProps(props.className, (value) => {
				return cx(
					styles.iconButtonReset,
					styles.iconButton({
						size,
					}),
					value,
				);
			})}
			size={size}
		>
			<Icon name={icon} aria-hidden />
		</Button>
	);
}

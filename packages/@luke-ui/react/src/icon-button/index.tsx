import type { JSX } from 'react';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import type { ButtonProps as PrimitiveButtonProps } from '../button/primitive.js';
import { Button } from '../button/primitive.js';
import type { IconName } from '../icon/index.js';
import { Icon } from '../icon/index.js';
import * as styles from '../recipes/icon-button.css.js';
import { cx } from '../utils/index.js';

interface IconButtonVariantProps extends NonNullable<styles.IconButtonVariants> {}

interface IconButtonStyleProps {
	/** Sets the button size. */
	size?: IconButtonVariantProps['size'];
}

/** Props for `IconButton`. */
export interface IconButtonProps
	extends Omit<PrimitiveButtonProps, keyof IconButtonStyleProps>, IconButtonStyleProps {
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

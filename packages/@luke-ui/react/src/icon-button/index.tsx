import type { JSX } from 'react';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import type { ButtonProps as PrimitiveButtonProps } from '../button/primitive/index.js';
import { Button } from '../button/primitive/index.js';
import type { IconName } from '../icon/index.js';
import { Icon } from '../icon/index.js';
import * as styles from '../recipes/icon-button.css.js';
import type { DocumentedPressProps } from '../types/documented-rac-props.js';
import { cx } from '../utils/index.js';

interface IconButtonRecipeProps extends NonNullable<styles.IconButtonVariants> {}

interface IconButtonStyleProps {
	/**
	 * Sets the button size.
	 * @default 'medium'
	 */
	size?: IconButtonRecipeProps['size'];
}

/**
 * Props for `IconButton`.
 *
 * @tier composed
 */
export interface IconButtonProps
	extends
		Omit<PrimitiveButtonProps, keyof IconButtonStyleProps | keyof DocumentedPressProps>,
		IconButtonStyleProps,
		DocumentedPressProps {
	/** Icon name from the generated icon set. */
	icon: IconName;
}

/** Button that renders only an icon. */
export function IconButton(props: IconButtonProps): JSX.Element {
	const { icon, isPending = false, size = 'medium', ...buttonProps } = props;

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
			isPending={isPending}
			size={size}
		>
			<Icon aria-hidden className={styles.icon({ isPending })} name={icon} />
		</Button>
	);
}

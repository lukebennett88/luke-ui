import type { JSX } from 'react';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import type { ButtonProps as PrimitiveButtonProps } from '../button/primitive/index.js';
import { Button } from '../button/primitive/index.js';
import type { IconName } from '../icon/index.js';
import { Icon } from '../icon/index.js';
import * as styles from '../recipes/icon-button.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { DocumentedPressProps } from '../types/documented-rac-props.js';
import type { Prettify } from '../types/prettify.js';
import { cx } from '../utils/index.js';

interface IconButtonRecipeProps extends NonNullable<styles.IconButtonVariants> {}

interface IconButtonStyleProps {
	/**
	 * Sets the button size.
	 * @default 'medium'
	 */
	size?: IconButtonRecipeProps['size'];
}

type _IconButtonOmit = DistributiveOmit<PrimitiveButtonProps, 'size' | keyof DocumentedPressProps>;

interface _IconButtonProps extends _IconButtonOmit, IconButtonStyleProps, DocumentedPressProps {
	/** Icon name from the generated icon set. */
	icon: IconName;
}

/**
 * Props for `IconButton`.
 *
 * @tier composed
 */
export type IconButtonProps = Prettify<_IconButtonProps>;

/** Button that renders only an icon. */
export function IconButton(props: IconButtonProps): JSX.Element {
	const { icon, isPending = false, size = 'medium', ...buttonProps } = props;
	const iconButtonStyles = styles.iconButton({ isPending, size });

	return (
		<Button
			{...buttonProps}
			className={composeRenderProps(props.className, (value) => {
				return cx(iconButtonStyles.root, value);
			})}
			isPending={isPending}
			size={size}
		>
			<Icon aria-hidden className={iconButtonStyles.icon} name={icon} />
		</Button>
	);
}

export { type IconButtonRecipeVariants, iconButtonRecipe } from './recipe.css.js';

import type { JSX } from 'react';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import type { IconName } from '../icon/icon.js';
import { Icon } from '../icon/icon.js';
import type { ButtonProps as PrimitiveButtonProps } from '../primitives/button/button.js';
import { Button } from '../primitives/button/button.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { DocumentedPressProps } from '../types/documented-rac-props.js';
import type { Prettify } from '../types/prettify.js';
import { cx } from '../utils/utils.js';
import type { IconButtonRecipeVariants } from './recipe.css.js';
import { iconButtonIcon, iconButtonRecipe, iconButtonReset } from './recipe.css.js';

interface IconButtonRecipeProps extends NonNullable<IconButtonRecipeVariants> {}

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

/** Props for `IconButton`. */
export type IconButtonProps = Prettify<_IconButtonProps>;

/** Button that renders only an icon. */
export function IconButton(props: IconButtonProps): JSX.Element {
	const { icon, isPending = false, size = 'medium', ...buttonProps } = props;

	return (
		<Button
			{...buttonProps}
			className={composeRenderProps(props.className, (value) => {
				return cx(
					iconButtonReset,
					iconButtonRecipe({
						size,
					}),
					value,
				);
			})}
			isPending={isPending}
			size={size}
		>
			<Icon aria-hidden className={iconButtonIcon({ isPending })} name={icon} />
		</Button>
	);
}

import type { JSX } from 'react';
import type { IconName } from '../icon/icon.js';
import { Icon } from '../icon/icon.js';
import type { ButtonProps as PrimitiveButtonProps } from '../primitives/button/button.js';
import { renderButton } from '../primitives/button/button.js';
import type { XStyleProps } from '../styles/xstyle.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { DocumentedPressProps } from '../types/documented-rac-props.js';
import type { Prettify } from '../types/prettify.js';
import type { IconButtonRecipeVariants } from './recipe.js';
import {
	iconButtonIcon,
	resolveIconButtonRecipeStyles,
	resolveIconButtonResetStyles,
} from './recipe.js';

interface IconButtonRecipeProps extends NonNullable<IconButtonRecipeVariants> {}

interface IconButtonStyleProps extends XStyleProps {
	/**
	 * Sets the button size.
	 * @default 'medium'
	 */
	size?: IconButtonRecipeProps['size'];
}

type _IconButtonOmit = DistributiveOmit<
	PrimitiveButtonProps,
	'isBlock' | 'size' | 'xstyle' | keyof DocumentedPressProps
>;

interface _IconButtonProps extends _IconButtonOmit, IconButtonStyleProps, DocumentedPressProps {
	/** Icon name from the generated icon set. */
	icon: IconName;
}

/** Props for `IconButton`. */
export type IconButtonProps = Prettify<_IconButtonProps>;

/** Button that renders only an icon. */
export function IconButton(props: IconButtonProps): JSX.Element {
	const { icon, isPending = false, size = 'medium', xstyle, ...buttonProps } = props;

	return renderButton(
		{
			...buttonProps,
			children: <Icon aria-hidden className={iconButtonIcon({ isPending })} name={icon} />,
			isPending,
			size,
			xstyle,
		},
		[...resolveIconButtonResetStyles(), ...resolveIconButtonRecipeStyles({ size })],
	);
}

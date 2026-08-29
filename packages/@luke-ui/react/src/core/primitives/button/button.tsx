import type { JSX } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components/Button';
import { Button as RacButton } from 'react-aria-components/Button';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { cx } from '../../../shared/utils/utils.js';
import { IconSizeProvider } from '../../icon/icon-size-context.js';
import { BUTTON_ICON_SIZE } from '../../sizing/button-sizing.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { DocumentedPressProps } from '../../types/documented-rac-props.js';
import type { Prettify } from '../../types/prettify.js';
import type { ButtonRecipeVariants } from './recipe.css.js';
import { buttonRecipe } from './recipe.css.js';

interface ButtonRecipeProps extends NonNullable<ButtonRecipeVariants> {}

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

type _ButtonOmit = DistributiveOmit<RacButtonProps, keyof DocumentedPressProps>;

interface _ButtonProps extends _ButtonOmit, ButtonStyleProps, DocumentedPressProps {}

/** Props for the button primitive. */
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

	return (
		<IconSizeProvider size={BUTTON_ICON_SIZE}>
			<RacButton
				{...restProps}
				className={composeRenderProps(props.className, (className) => {
					return cx(buttonRecipe({ appearance, isBlock, size, tone }), className);
				})}
				isDisabled={isDisabled}
				isPending={isPending}
			>
				{children}
			</RacButton>
		</IconSizeProvider>
	);
}

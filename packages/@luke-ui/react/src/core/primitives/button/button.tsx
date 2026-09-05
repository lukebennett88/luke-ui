import type { JSX } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components/Button';
import { Button as RacButton } from 'react-aria-components/Button';
import { IconSizeProvider } from '../../icon/icon-size-context.js';
import { BUTTON_ICON_SIZE } from '../../sizing/button-sizing.js';
import type { XStyleProps } from '../../styles/xstyle.js';
import { composeRacRecipeProps } from '../../styles/xstyle.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { DocumentedPressProps } from '../../types/documented-rac-props.js';
import type { Prettify } from '../../types/prettify.js';
import type { ButtonRecipeVariants } from './recipe.js';
import { buttonRecipe } from './recipe.js';

interface ButtonRecipeProps extends NonNullable<ButtonRecipeVariants> {}

interface ButtonStyleProps extends XStyleProps {
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
		className,
		isBlock = false,
		isDisabled = false,
		isPending = false,
		size = 'medium',
		style,
		tone = 'neutral',
		xstyle,
		...restProps
	} = props;
	const recipeProps = buttonRecipe({ appearance, isBlock, size, tone, xstyle });

	return (
		<IconSizeProvider size={BUTTON_ICON_SIZE}>
			<RacButton
				{...restProps}
				{...composeRacRecipeProps(recipeProps, className, style)}
				isDisabled={isDisabled}
				isPending={isPending}
			>
				{children}
			</RacButton>
		</IconSizeProvider>
	);
}

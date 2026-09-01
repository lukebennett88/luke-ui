import type { CompiledStyles } from '@stylexjs/stylex';
import type { JSX } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components/Button';
import { Button as RacButton } from 'react-aria-components/Button';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { IconSizeProvider } from '../../icon/icon-size-context.js';
import { BUTTON_ICON_SIZE } from '../../sizing/button-sizing.js';
import type { XStyleProp } from '../../styles/xstyle.js';
import { resolveXStyleProps } from '../../styles/xstyle.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { DocumentedPressProps } from '../../types/documented-rac-props.js';
import type { Prettify } from '../../types/prettify.js';
import type { ButtonRecipeVariants } from './recipe.js';
import { resolveButtonRecipeStyles } from './recipe.js';

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
	/**
	 * Extra styles as one or more `stylex.create(...)` objects. Applied after every variant prop
	 * above and before `className`. A same-property `xstyle` value wins over a variant such as
	 * `tone`. A consumer `className` still beats `xstyle`, and inline `style` beats `className`.
	 */
	xstyle?: XStyleProp;
}

type _ButtonOmit = DistributiveOmit<RacButtonProps, keyof DocumentedPressProps>;

interface _ButtonProps extends _ButtonOmit, ButtonStyleProps, DocumentedPressProps {}

/** Props for the button primitive. */
export type ButtonProps = Prettify<_ButtonProps>;

/** Primitive button. See `ButtonProps`. */
export function Button(props: ButtonProps): JSX.Element {
	return renderButton(props);
}

/** Package-private Button renderer for wrappers that contribute their own compiled styles. */
export function renderButton(
	props: ButtonProps,
	internalStyles: ReadonlyArray<CompiledStyles> = [],
): JSX.Element {
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
	const recipeStyles = [
		...resolveButtonRecipeStyles({ appearance, isBlock, size, tone }),
		...internalStyles,
	];

	return (
		<IconSizeProvider size={BUTTON_ICON_SIZE}>
			<RacButton
				{...restProps}
				className={composeRenderProps(className, (resolvedClassName) => {
					return (
						resolveXStyleProps(recipeStyles, xstyle, resolvedClassName, undefined).className ?? ''
					);
				})}
				isDisabled={isDisabled}
				isPending={isPending}
				style={composeRenderProps(style, (resolvedStyle) => {
					return resolveXStyleProps(recipeStyles, xstyle, undefined, resolvedStyle).style;
				})}
			>
				{children}
			</RacButton>
		</IconSizeProvider>
	);
}

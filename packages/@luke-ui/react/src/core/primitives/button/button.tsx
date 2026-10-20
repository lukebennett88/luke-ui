import type { JSX, Ref } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components/Button';
import { Button as RacButton } from 'react-aria-components/Button';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import type { ButtonPresentationProps } from '../../action-presentation.js';
import { IconSizeProvider } from '../../icon/icon-size-context.js';
import { BUTTON_ICON_SIZE } from '../../sizing/button-sizing.js';
import { useControlSize } from '../../sizing/control-size-context.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { DocumentedPressProps } from '../../types/documented-rac-props.js';
import type { Prettify } from '../../types/prettify.js';
import { buttonRecipeInternal } from './recipe.css.js';

type _ButtonOmit = DistributiveOmit<RacButtonProps, 'render' | keyof DocumentedPressProps>;
type _ButtonProps = _ButtonOmit &
	ButtonPresentationProps &
	DocumentedPressProps & {
		/** Ref forwarded to the underlying button element. */
		ref?: Ref<HTMLButtonElement>;
	};

/** Props for the button primitive. */
export type ButtonProps = Prettify<_ButtonProps>;

/** Primitive button. See `ButtonProps`. */
export function Button(props: ButtonProps): JSX.Element {
	const {
		appearance = 'button',
		tone = 'neutral',
		prominence = 'standard',
		children,
		inlineSize = 'auto',
		isDisabled = false,
		isPending = false,
		size: sizeProp,
		...restProps
	} = props;
	const size = useControlSize(sizeProp);

	return (
		<IconSizeProvider size={BUTTON_ICON_SIZE}>
			<RacButton
				{...restProps}
				className={composeRenderProps(props.className, (className) => {
					return buttonRecipeInternal({
						appearance,
						className,
						inlineSize,
						prominence,
						size,
						tone,
					});
				})}
				isDisabled={isDisabled}
				isPending={isPending}
			>
				{children}
			</RacButton>
		</IconSizeProvider>
	);
}

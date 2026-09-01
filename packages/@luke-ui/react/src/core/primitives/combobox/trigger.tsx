import type { JSX } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components/ComboBox';
import { Button as RacButton } from 'react-aria-components/ComboBox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { IconSizeProvider } from '../../icon/icon-size-context.js';
import { FIELD_CONTROL_ICON_SIZE } from '../../sizing/control-size.js';
import type { XStyleProps } from '../../styles/xstyle.js';
import { resolveXStyleProps } from '../../styles/xstyle.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import type { ComboboxSize } from './recipe.js';
import { resolveComboboxRecipeStyles } from './recipe.js';
import { useComboboxSize } from './size-context.js';

type _ComboboxTriggerOmit = DistributiveOmit<RacButtonProps, 'className'>;
interface _ComboboxTriggerProps extends _ComboboxTriggerOmit, XStyleProps {
	className?: RacButtonProps['className'];
	size?: ComboboxSize;
}

/** Props for the combobox trigger button. */
export type ComboboxTriggerProps = Prettify<_ComboboxTriggerProps>;

/** Trigger button used by combobox pattern. */
export function ComboboxTrigger(props: ComboboxTriggerProps): JSX.Element {
	const { size: sizeProp, style, xstyle, ...buttonProps } = props;
	const size = useComboboxSize(sizeProp);
	const recipeStyles = resolveComboboxRecipeStyles({ size }).trigger;

	// Nested icons follow this part's resolved size, including a local `size` override.
	return (
		<IconSizeProvider size={FIELD_CONTROL_ICON_SIZE[size]}>
			<RacButton
				{...buttonProps}
				className={composeRenderProps(buttonProps.className, (className) => {
					return resolveXStyleProps(recipeStyles, xstyle, className, undefined).className ?? '';
				})}
				style={composeRenderProps(style, (value) => {
					return resolveXStyleProps(recipeStyles, xstyle, undefined, value).style;
				})}
			/>
		</IconSizeProvider>
	);
}

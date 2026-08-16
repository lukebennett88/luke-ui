import type { JSX } from 'react';
import { useContext } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components/ComboBox';
import { ComboBoxStateContext, Button as RacButton } from 'react-aria-components/ComboBox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { IconSizeProvider } from '../../icon/icon-size-context.js';
import { FIELD_CONTROL_ICON_SIZE } from '../../sizing/control-size.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import type { ComboboxSize } from './root.js';
import { useComboboxSize } from './size-context.js';
import { comboboxRecipe } from './styles.css.js';

type _ComboboxClearButtonOmit = DistributiveOmit<RacButtonProps, 'className' | 'slot'>;
interface _ComboboxClearButtonProps extends _ComboboxClearButtonOmit {
	className?: RacButtonProps['className'];
	size?: ComboboxSize;
}

/** Props for the combobox clear button. */
export type ComboboxClearButtonProps = Prettify<_ComboboxClearButtonProps>;

/** Clears the combobox selection. Renders nothing while no option is selected. */
export function ComboboxClearButton(props: ComboboxClearButtonProps): JSX.Element | null {
	const { size: sizeProp, ...buttonProps } = props;
	const size = useComboboxSize(sizeProp);
	const state = useContext(ComboBoxStateContext);
	const hasValue = Array.isArray(state?.value) ? state.value.length > 0 : state?.value != null;

	if (state == null || !hasValue) {
		return null;
	}

	// Nested icons follow this part's resolved size, including a local `size` override.
	return (
		<IconSizeProvider size={FIELD_CONTROL_ICON_SIZE[size]}>
			<RacButton
				{...buttonProps}
				className={composeRenderProps(buttonProps.className, (className) => {
					return comboboxRecipe({ size }).clearButton(className);
				})}
				onPress={(event) => {
					state.setValue(Array.isArray(state.value) ? [] : null);
					state.setInputValue('');
					buttonProps.onPress?.(event);
				}}
				// Opt out of the ComboBox button slot so pressing clears the selection
				// instead of toggling the popover.
				slot={null}
			/>
		</IconSizeProvider>
	);
}

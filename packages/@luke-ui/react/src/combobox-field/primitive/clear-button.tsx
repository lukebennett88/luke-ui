import type { JSX } from 'react';
import { useContext } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components/ComboBox';
import { Button as RacButton, ComboBoxStateContext } from 'react-aria-components/ComboBox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { IconSizeProvider } from '../../icon-size-context/index.js';
import * as styles from '../../recipes/combobox.css.js';
import { COMBOBOX_ICON_SIZE } from '../../sizing/combobox-sizing.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import { cx } from '../../utils/index.js';
import type { ComboboxSize } from './root.js';
import { useComboboxSize } from './size-context.js';

/**
 * Props for the combobox clear button.
 *
 * @tier primitive
 */
export interface ComboboxClearButtonProps
	extends DistributiveOmit<RacButtonProps, 'className' | 'slot'> {
	className?: RacButtonProps['className'];
	size?: ComboboxSize;
}

/** Clears the combobox selection. Renders nothing while no option is selected. */
export function ComboboxClearButton(props: ComboboxClearButtonProps): JSX.Element | null {
	const { size: sizeProp, ...buttonProps } = props;
	const size = useComboboxSize(sizeProp);
	const state = useContext(ComboBoxStateContext);
	const hasValue = Array.isArray(state?.value) ? state.value.length > 0 : state?.value != null;

	if (state == null || !hasValue) {
		return null;
	}

	return (
		<IconSizeProvider size={COMBOBOX_ICON_SIZE[size]}>
			<RacButton
				{...buttonProps}
				className={composeRenderProps(buttonProps.className, (className) => {
					return cx(styles.comboboxClearButton({ size }), className);
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

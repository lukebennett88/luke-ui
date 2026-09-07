import type { JSX } from 'react';
import { useContext } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components/ComboBox';
import { ComboBoxStateContext, Button as RacButton } from 'react-aria-components/ComboBox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { IconSizeProvider } from '../../icon/icon-size-context.js';
import { FIELD_CONTROL_ICON_SIZE } from '../../sizing/control-size.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { useComboboxPresentation } from './presentation-context.js';
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

/**
 * Clears the selection beside a persistent input and hides when no option is selected. Inside a
 * `ComboboxTray`, clears the search text and hides while the search is empty.
 */
export function ComboboxClearButton(props: ComboboxClearButtonProps): JSX.Element | null {
	const { size: sizeProp, ...buttonProps } = props;
	const presentation = useComboboxPresentation();
	const size = useComboboxSize(sizeProp);
	const state = useContext(ComboBoxStateContext);

	if (state == null) return null;

	// Inside a tray the button clears the search text; beside a persistent input it clears the
	// selection. Both what the button hides on and what pressing it does follow from that one
	// choice, so derive them together rather than branching on it twice.
	const clear =
		presentation === 'tray'
			? {
					isEmpty: state.inputValue === '',
					onClear: () => {
						state.setInputValue('');
					},
				}
			: {
					isEmpty: Array.isArray(state.value) ? state.value.length === 0 : state.value == null,
					onClear: () => {
						state.setValue(Array.isArray(state.value) ? [] : null);
						state.setInputValue('');
					},
				};

	if (clear.isEmpty) return null;

	// Nested icons follow this part's resolved size, including a local `size` override.
	return (
		<IconSizeProvider size={FIELD_CONTROL_ICON_SIZE[size]}>
			<RacButton
				{...buttonProps}
				className={composeRenderProps(buttonProps.className, (className) => {
					return comboboxRecipe({ size }).clearButton({ className });
				})}
				onPress={(event) => {
					clear.onClear();
					buttonProps.onPress?.(event);
				}}
				// Opt out of the ComboBox button slot so pressing clears the selection
				// instead of toggling the popover.
				slot={null}
			/>
		</IconSizeProvider>
	);
}

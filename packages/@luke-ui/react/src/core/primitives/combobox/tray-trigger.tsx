import type { JSX, ReactNode } from 'react';
import { useContext, useId } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components/Button';
import { Button as RacButton, ButtonContext } from 'react-aria-components/Button';
import { ComboBoxStateContext, ComboBoxValue } from 'react-aria-components/ComboBox';
import { LabelContext } from 'react-aria-components/Label';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { useSlottedContext } from 'react-aria-components/slots';
import { cx } from '../../../shared/utils/utils.js';
import { IconSizeProvider } from '../../icon/icon-size-context.js';
import { FIELD_CONTROL_ICON_SIZE } from '../../sizing/control-size.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import type { ComboboxSize } from './root.js';
import { useComboboxSize } from './size-context.js';
import { comboboxRecipe } from './styles.css.js';

type _ComboboxTrayTriggerOmit = DistributiveOmit<
	RacButtonProps,
	'aria-expanded' | 'aria-haspopup' | 'children' | 'className' | 'slot'
>;

interface _ComboboxTrayTriggerProps extends _ComboboxTrayTriggerOmit {
	/** Trailing content rendered after the selected value, typically a chevron icon. */
	children?: ReactNode;
	className?: RacButtonProps['className'];
	/** Text shown while nothing is selected. */
	placeholder?: string;
	size?: ComboboxSize;
}

/** Props for the combobox tray trigger. */
export type ComboboxTrayTriggerProps = Prettify<_ComboboxTrayTriggerProps>;

/** Shows the selected value and opens a sibling `ComboboxTray`. */
export function ComboboxTrayTrigger(props: ComboboxTrayTriggerProps): JSX.Element | null {
	const { children, isDisabled, placeholder, size: sizeProp, ...buttonProps } = props;
	const size = useComboboxSize(sizeProp);
	const labelContext = useSlottedContext(LabelContext);
	const buttonContext = useSlottedContext(ButtonContext);
	const state = useContext(ComboBoxStateContext);
	const valueId = useId();

	if (state == null) return null;

	// `ButtonContext` carries React Aria's combined `isDisabled || isReadOnly` state for the
	// combobox, so this trigger needs no `isReadOnly` prop of its own.
	const resolvedIsDisabled = isDisabled === true || buttonContext?.isDisabled === true;

	// A caller-supplied name wins over the field label's default naming.
	const { ariaLabel, ariaLabelledBy } = (() => {
		if (buttonProps['aria-labelledby'] != null) {
			return { ariaLabel: undefined, ariaLabelledBy: buttonProps['aria-labelledby'] };
		}
		if (buttonProps['aria-label'] != null) {
			return { ariaLabel: buttonProps['aria-label'], ariaLabelledBy: undefined };
		}
		if (labelContext?.id != null) {
			return { ariaLabel: undefined, ariaLabelledBy: cx(labelContext.id, valueId) };
		}
		return { ariaLabel: labelContext?.['aria-label'], ariaLabelledBy: undefined };
	})();

	// Nested icons follow this part's resolved size, including a local `size` override.
	return (
		<IconSizeProvider size={FIELD_CONTROL_ICON_SIZE[size]}>
			<RacButton
				{...buttonProps}
				aria-expanded={state.isOpen}
				aria-haspopup="dialog"
				aria-label={ariaLabel}
				aria-labelledby={ariaLabelledBy}
				className={composeRenderProps(buttonProps.className, (className) => {
					return comboboxRecipe({ size }).trayTrigger({ className });
				})}
				isDisabled={resolvedIsDisabled}
				onPress={(event) => {
					if (resolvedIsDisabled) return;

					state.open(null, 'manual');
					buttonProps.onPress?.(event);
				}}
				// Opt out of the ComboBox button slot: this trigger owns its own press behaviour
				// and must not also be wired up as the popover toggle.
				slot={null}
			>
				<ComboBoxValue
					className={comboboxRecipe().trayValue()}
					id={valueId}
					placeholder={placeholder}
				/>
				{children}
			</RacButton>
		</IconSizeProvider>
	);
}

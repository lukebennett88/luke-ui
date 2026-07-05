import type { JSX } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components/ComboBox';
import { Button as RacButton } from 'react-aria-components/ComboBox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { IconSizeProvider } from '../../icon-size-context/index.js';
import * as styles from '../../recipes/combobox.css.js';
import { COMBOBOX_ICON_SIZE } from '../../sizing/combobox-sizing.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import { cx } from '../../utils/index.js';
import type { ComboboxSize } from './root.js';
import { useComboboxSize } from './size-context.js';

/**
 * Props for the combobox trigger button.
 *
 * @tier primitive
 */
export interface ComboboxTriggerProps extends DistributiveOmit<RacButtonProps, 'className'> {
	className?: RacButtonProps['className'];
	size?: ComboboxSize;
}

/** Trigger button used by combobox pattern. */
export function ComboboxTrigger(props: ComboboxTriggerProps): JSX.Element {
	const { size: sizeProp, ...buttonProps } = props;
	const size = useComboboxSize(sizeProp);

	return (
		<IconSizeProvider size={COMBOBOX_ICON_SIZE[size]}>
			<RacButton
				{...buttonProps}
				className={composeRenderProps(buttonProps.className, (className) => {
					return cx(styles.comboboxTrigger({ size }), className);
				})}
			/>
		</IconSizeProvider>
	);
}

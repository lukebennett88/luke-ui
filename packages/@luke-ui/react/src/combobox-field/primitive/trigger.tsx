import type { JSX } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components/ComboBox';
import { Button as RacButton } from 'react-aria-components/ComboBox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { IconSizeProvider } from '../../icon-size-context/index.js';
import * as styles from '../../recipes/combobox.js';
import { COMBOBOX_ICON_SIZE } from '../../sizing/combobox-sizing.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { cx } from '../../utils/index.js';
import type { ComboboxSize } from './root.js';
import { useComboboxSize } from './size-context.js';

type _ComboboxTriggerOmit = DistributiveOmit<RacButtonProps, 'className'>;
interface _ComboboxTriggerProps extends _ComboboxTriggerOmit {
	className?: RacButtonProps['className'];
	size?: ComboboxSize;
}

/**
 * Props for the combobox trigger button.
 *
 * @tier primitive
 */
export type ComboboxTriggerProps = Prettify<_ComboboxTriggerProps>;

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

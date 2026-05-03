import type { JSX } from 'react';
import type { ButtonProps as RacButtonProps } from 'react-aria-components/ComboBox';
import { Button as RacButton } from 'react-aria-components/ComboBox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import * as styles from '../recipes/combobox.css.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import { cx } from '../utils/index.js';

interface ComboboxVariantProps extends NonNullable<styles.ComboboxVariants> {}

interface ComboboxStyleProps {
	size?: ComboboxVariantProps['size'];
}

/** Props for the combobox trigger button. */
export interface ComboboxTriggerProps
	extends DistributiveOmit<RacButtonProps, 'className'>, ComboboxStyleProps {
	className?: RacButtonProps['className'];
}

/** Trigger button used by combobox pattern. */
export function ComboboxTrigger(props: ComboboxTriggerProps): JSX.Element {
	const { size = 'medium', ...buttonProps } = props;

	return (
		<RacButton
			{...buttonProps}
			className={composeRenderProps(buttonProps.className, (className) => {
				return cx(styles.comboboxTrigger({ size }), className);
			})}
		/>
	);
}

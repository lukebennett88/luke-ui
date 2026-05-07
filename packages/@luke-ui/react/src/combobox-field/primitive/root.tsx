import type { JSX } from 'react';
import type { ComboBoxProps as RacComboBoxProps, Key } from 'react-aria-components/ComboBox';
import { ComboBox as RacComboBox } from 'react-aria-components/ComboBox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import * as styles from '../../recipes/combobox.css.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import { cx } from '../../utils/index.js';

interface ComboboxVariantProps extends NonNullable<styles.ComboboxVariants> {}

export type ComboboxSize = NonNullable<ComboboxVariantProps['size']>;

export interface ComboboxInputProps<T extends object> extends DistributiveOmit<
	RacComboBoxProps<T, 'single'>,
	| 'defaultSelectedKey'
	| 'defaultValue'
	| 'onChange'
	| 'onOpenChange'
	| 'onSelectionChange'
	| 'selectedKey'
	| 'selectionMode'
	| 'value'
> {
	/** The currently selected key (controlled). Pass `null` for no selection. */
	value?: Key | null;

	/** The initially selected key (uncontrolled). */
	defaultValue?: Key | null;

	/** Called when the selected value changes. */
	onChange?: (value: Key | null) => void;

	/** Called when the open state changes. */
	onOpenChange?: (isOpen: boolean) => void;

	/**
	 * The interaction required to display the ComboBox menu.
	 * @default 'focus'
	 */
	menuTrigger?: 'focus' | 'input' | 'manual';
}

export function ComboboxInput<T extends object>(props: ComboboxInputProps<T>): JSX.Element {
	const { className, menuTrigger = 'focus', ...comboboxProps } = props;

	return (
		<RacComboBox
			{...comboboxProps}
			menuTrigger={menuTrigger}
			className={composeRenderProps(className, (renderedClassName) => {
				return cx(styles.comboboxRoot, renderedClassName);
			})}
		/>
	);
}

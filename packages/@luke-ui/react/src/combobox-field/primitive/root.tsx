import type { JSX, Ref } from 'react';
import type { Key, ComboBoxProps as RacComboBoxProps } from 'react-aria-components/ComboBox';
import { ComboBox as RacComboBox } from 'react-aria-components/ComboBox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import * as styles from '../../recipes/combobox.css.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { cx } from '../../utils/index.js';
import { ComboboxSizeProvider } from './size-context.js';

interface ComboboxVariantProps extends NonNullable<styles.ComboboxVariants> {}

export type ComboboxSize = NonNullable<ComboboxVariantProps['size']>;

interface _ComboboxRootProps<T extends object> extends DistributiveOmit<
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
	/** Forwarded to the combobox root element. */
	ref?: Ref<HTMLDivElement>;

	/** The initially selected key (uncontrolled). */
	defaultValue?: Key | null;

	/**
	 * The interaction required to display the ComboBox menu.
	 * @default 'focus'
	 */
	menuTrigger?: 'focus' | 'input' | 'manual';

	/** Called when the selected value changes. */
	onChange?: (value: Key | null) => void;

	/** Called when the open state changes. */
	onOpenChange?: (isOpen: boolean) => void;

	/** Control size. @default 'medium' */
	size?: ComboboxSize;
	/** The currently selected key (controlled). Pass `null` for no selection. */
	value?: Key | null;
}

/**
 * Props for the primitive combobox root.
 *
 * @tier primitive
 */
export type ComboboxRootProps<T extends object> = Prettify<_ComboboxRootProps<T>>;

export function ComboboxRoot<T extends object>(props: ComboboxRootProps<T>): JSX.Element {
	const { className, menuTrigger = 'focus', ref, size = 'medium', ...comboboxProps } = props;

	return (
		<ComboboxSizeProvider size={size}>
			<RacComboBox
				{...comboboxProps}
				className={composeRenderProps(className, (renderedClassName) => {
					return cx(styles.comboboxRoot, renderedClassName);
				})}
				menuTrigger={menuTrigger}
				ref={ref}
			/>
		</ComboboxSizeProvider>
	);
}

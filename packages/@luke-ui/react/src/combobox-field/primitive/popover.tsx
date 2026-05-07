import type { JSX } from 'react';
import type { PopoverProps as RacPopoverProps } from 'react-aria-components/ComboBox';
import { Popover as RacPopover } from 'react-aria-components/ComboBox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import * as styles from '../../recipes/combobox.css.js';
import { themeRootClassName } from '../../theme/index.js';
import { cx } from '../../utils/index.js';

/** Props for the styled combobox popover. */
export interface ComboboxPopoverProps extends Omit<RacPopoverProps, 'UNSTABLE_portalContainer'> {}

/** Popover surface used for listbox content. */
export function ComboboxPopover(props: ComboboxPopoverProps): JSX.Element {
	return (
		<RacPopover
			{...props}
			className={composeRenderProps(props.className, (className) => {
				return cx(themeRootClassName, styles.comboboxPopover(), className);
			})}
		/>
	);
}

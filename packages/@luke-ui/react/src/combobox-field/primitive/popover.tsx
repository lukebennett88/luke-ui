import { mergeRefs } from '@react-aria/utils';
import type { JSX, Ref } from 'react';
import { useState } from 'react';
import type { PopoverProps as RacPopoverProps } from 'react-aria-components/ComboBox';
import { Popover as RacPopover } from 'react-aria-components/ComboBox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import * as styles from '../../recipes/combobox.css.js';
import { themeRootClassName } from '../../theme/index.js';
import { cx } from '../../utils/index.js';
import { useVisualViewportVars } from './use-visual-viewport-vars.js';

/**
 * Props for the styled combobox popover.
 *
 * @tier primitive
 */
export interface ComboboxPopoverProps extends Omit<RacPopoverProps, 'UNSTABLE_portalContainer'> {
	/** Forwarded to the popover's DOM element. */
	ref?: Ref<HTMLElement>;
}

/** Popover surface used for listbox content. */
export function ComboboxPopover(props: ComboboxPopoverProps): JSX.Element {
	const { ref, ...restProps } = props;
	const [element, setElement] = useState<HTMLElement | null>(null);
	useVisualViewportVars(element);

	return (
		<RacPopover
			{...restProps}
			className={composeRenderProps(restProps.className, (className) => {
				return cx(themeRootClassName, styles.comboboxPopover(), className);
			})}
			ref={mergeRefs(ref, (node: HTMLElement | null) => setElement(node))}
		/>
	);
}

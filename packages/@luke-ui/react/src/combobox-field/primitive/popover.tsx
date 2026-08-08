import { mergeRefs } from '@react-aria/utils';
import type { JSX, Ref } from 'react';
import { useState } from 'react';
import type { PopoverProps as RacPopoverProps } from 'react-aria-components/ComboBox';
import { Popover as RacPopover } from 'react-aria-components/ComboBox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import * as styles from '../../recipes/combobox.css.js';
import { rootClassName } from '../../theme/index.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { cx } from '../../utils/index.js';
import { useTrayViewportVars } from './use-tray-viewport-vars.js';

type _ComboboxPopoverOmit = DistributiveOmit<RacPopoverProps, 'UNSTABLE_portalContainer'>;
interface _ComboboxPopoverProps extends _ComboboxPopoverOmit {
	/** Forwarded to the popover's DOM element. */
	ref?: Ref<HTMLElement>;
}

/**
 * Props for the styled combobox popover.
 *
 * @tier primitive
 */
export type ComboboxPopoverProps = Prettify<_ComboboxPopoverProps>;

/**
 * Popover surface used for listbox content. The portal inherits the document's theme: importing a
 * theme stylesheet themes the whole document from `:root`, so no propagation is needed. A colour
 * mode scoped below `<html>` does not reach the portal.
 */
export function ComboboxPopover(props: ComboboxPopoverProps): JSX.Element {
	const { ref, ...restProps } = props;
	const [element, setElement] = useState<HTMLElement | null>(null);
	useTrayViewportVars(element);

	return (
		<RacPopover
			{...restProps}
			className={composeRenderProps(restProps.className, (className) => {
				return cx(rootClassName, styles.combobox().popover(className));
			})}
			ref={mergeRefs<HTMLElement>(ref, setElement)}
		/>
	);
}

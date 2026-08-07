import { mergeRefs } from '@react-aria/utils';
import type { JSX, Ref } from 'react';
import { useState } from 'react';
import type { PopoverProps as RacPopoverProps } from 'react-aria-components/ComboBox';
import { Popover as RacPopover } from 'react-aria-components/ComboBox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import * as styles from '../../recipes/combobox.css.js';
import { useThemeScopeProps } from '../../theme/index.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { cx } from '../../utils/index.js';
import { useVisualViewportVars } from './use-visual-viewport-vars.js';

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
 * Popover surface used for listbox content. The portal preserves the theme identity and explicit
 * colour mode active at its trigger.
 */
export function ComboboxPopover(props: ComboboxPopoverProps): JSX.Element {
	const { ref, ...restProps } = props;
	const [element, setElement] = useState<HTMLElement | null>(null);
	useVisualViewportVars(element);

	const themeScopeProps = useThemeScopeProps({ sourceRef: props.triggerRef });

	return (
		<RacPopover
			{...restProps}
			className={composeRenderProps(restProps.className, (className) => {
				return cx(themeScopeProps.className, styles.combobox().popover(className));
			})}
			data-color-mode={themeScopeProps['data-color-mode']}
			ref={mergeRefs(ref, themeScopeProps.ref, (node: HTMLElement | null) => setElement(node))}
		/>
	);
}

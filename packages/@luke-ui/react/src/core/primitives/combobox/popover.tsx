import { mergeRefs } from '@react-aria/utils';
import type { JSX, Ref } from 'react';
import type { PopoverProps as RacPopoverProps } from 'react-aria-components/ComboBox';
import { Popover as RacPopover } from 'react-aria-components/ComboBox';
import { PopoverContext } from 'react-aria-components/Popover';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { useSlottedContext } from 'react-aria-components/slots';
import { cx } from '../../../shared/utils/utils.js';
import { rootClassName } from '../../../theme/theme.js';
import { copyScopeColorMode } from '../../overlays/scope-color-mode.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { comboboxRecipe } from './styles.css.js';

type _ComboboxPopoverOmit = DistributiveOmit<RacPopoverProps, 'UNSTABLE_portalContainer'>;
interface _ComboboxPopoverProps extends _ComboboxPopoverOmit {
	/** Forwarded to the popover's DOM element. */
	ref?: Ref<HTMLElement>;
}

/** Props for the styled combobox popover. */
export type ComboboxPopoverProps = Prettify<_ComboboxPopoverProps>;

/** Popover surface used for listbox content. */
export function ComboboxPopover(props: ComboboxPopoverProps): JSX.Element {
	const { ref, ...restProps } = props;
	const popoverContext = useSlottedContext(PopoverContext);

	return (
		<RacPopover
			{...restProps}
			className={composeRenderProps(restProps.className, (className) => {
				return cx(rootClassName, comboboxRecipe().popover({ className }));
			})}
			ref={mergeRefs(ref, copyScopeColorMode(popoverContext?.triggerRef))}
		/>
	);
}

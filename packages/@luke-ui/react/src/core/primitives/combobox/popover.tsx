import { mergeRefs } from '@react-aria/utils';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import type { JSX, Ref } from 'react';
import { use } from 'react';
import type { PopoverProps as RacPopoverProps } from 'react-aria-components/ComboBox';
import { ComboBoxStateContext, Popover as RacPopover } from 'react-aria-components/ComboBox';
import { PopoverContext } from 'react-aria-components/Popover';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { useSlottedContext } from 'react-aria-components/slots';
import {
	resolveOverlayContainerPadding,
	useAvailableOverlayInlineSize,
} from '../../overlays/available-overlay-inline-size.js';
import { copyScopeColorMode } from '../../overlays/scope-color-mode.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { comboboxRecipe, popoverAvailableInlineSizeVar } from './styles.css.js';

type _ComboboxPopoverOmit = DistributiveOmit<RacPopoverProps, 'UNSTABLE_portalContainer'>;
interface _ComboboxPopoverProps extends _ComboboxPopoverOmit {
	/** Forwarded to the popover's DOM element. */
	ref?: Ref<HTMLElement>;
}

/** Props for the styled combobox popover. */
export type ComboboxPopoverProps = Prettify<_ComboboxPopoverProps>;

/** Popover surface used for listbox content. */
export function ComboboxPopover(props: ComboboxPopoverProps): JSX.Element {
	const { containerPadding: containerPaddingProp, ref, ...restProps } = props;
	const popoverContext = useSlottedContext(PopoverContext);
	const comboBoxState = use(ComboBoxStateContext);
	const containerPadding = resolveOverlayContainerPadding(
		containerPaddingProp,
		popoverContext?.containerPadding,
	);
	const availableInlineSize = useAvailableOverlayInlineSize(
		containerPadding,
		comboBoxState?.isOpen === true,
	);

	return (
		<RacPopover
			{...restProps}
			className={composeRenderProps(restProps.className, (className) => {
				return comboboxRecipe().popover({ className });
			})}
			containerPadding={containerPadding}
			ref={mergeRefs(ref, copyScopeColorMode(popoverContext?.triggerRef))}
			style={composeRenderProps(restProps.style, (style) => ({
				...style,
				...assignInlineVars({
					[popoverAvailableInlineSizeVar]: `${availableInlineSize}px`,
				}),
			}))}
		/>
	);
}

import { mergeRefs } from '@react-aria/utils';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import type { JSX, Ref } from 'react';
import type { PopoverProps as RacPopoverProps } from 'react-aria-components/ComboBox';
import { Popover as RacPopover } from 'react-aria-components/ComboBox';
import { PopoverContext } from 'react-aria-components/Popover';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { useSlottedContext } from 'react-aria-components/slots';
import {
	availableInlineSizeForContainerPadding,
	DEFAULT_OVERLAY_CONTAINER_PADDING,
	useOverlayViewportInlineSize,
} from '../../overlays/overlay-viewport-inline-size.js';
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
	const { containerPadding, ref, ...restProps } = props;
	const popoverContext = useSlottedContext(PopoverContext);
	const resolvedContainerPadding =
		containerPadding ?? popoverContext?.containerPadding ?? DEFAULT_OVERLAY_CONTAINER_PADDING;
	const viewportInlineSize = useOverlayViewportInlineSize();
	const availableInlineSize = availableInlineSizeForContainerPadding(
		resolvedContainerPadding,
		viewportInlineSize,
	);

	return (
		<RacPopover
			{...restProps}
			className={composeRenderProps(restProps.className, (className) => {
				return comboboxRecipe().popover({ className });
			})}
			containerPadding={resolvedContainerPadding}
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

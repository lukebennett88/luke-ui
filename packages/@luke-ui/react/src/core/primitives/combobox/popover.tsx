import type { JSX, Ref } from 'react';
import type { PopoverProps as RacPopoverProps } from 'react-aria-components/ComboBox';
import { Popover as RacPopover } from 'react-aria-components/ComboBox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { cx } from '../../../shared/utils/utils.js';
import { rootClassName } from '../../../theme/theme.js';
import type { XStyleProp } from '../../styles/xstyle.js';
import { resolveXStyleProps } from '../../styles/xstyle.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { resolveComboboxRecipeStyles } from './recipe.js';

type _ComboboxPopoverOmit = DistributiveOmit<RacPopoverProps, 'UNSTABLE_portalContainer'>;
interface _ComboboxPopoverProps extends _ComboboxPopoverOmit {
	/** Forwarded to the popover's DOM element. */
	ref?: Ref<HTMLElement>;
	/**
	 * Extra styles as one or more `stylex.create(...)` objects. Applied after `ComboboxPopover`'s
	 * own styles and before `className`. A same-property `xstyle` value wins over those styles. A
	 * consumer `className` still beats `xstyle`, and inline `style` beats `className`.
	 */
	xstyle?: XStyleProp;
}

/** Props for the styled combobox popover. */
export type ComboboxPopoverProps = Prettify<_ComboboxPopoverProps>;

/**
 * Popover surface used for listbox content. The portal inherits the document's theme: importing a
 * theme stylesheet themes the whole document from `:root`, so no propagation is needed. A colour
 * mode scoped below `<html>` does not reach the portal.
 */
export function ComboboxPopover(props: ComboboxPopoverProps): JSX.Element {
	const { ref, style, xstyle, ...restProps } = props;
	const recipeStyles = resolveComboboxRecipeStyles().popover;

	return (
		<RacPopover
			{...restProps}
			className={composeRenderProps(restProps.className, (className) => {
				return cx(
					rootClassName,
					resolveXStyleProps(recipeStyles, xstyle, className, undefined).className,
				);
			})}
			ref={ref}
			style={composeRenderProps(style, (value) => {
				return resolveXStyleProps(recipeStyles, xstyle, undefined, value).style;
			})}
		/>
	);
}

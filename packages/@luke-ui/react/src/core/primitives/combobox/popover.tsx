import type { JSX, Ref } from 'react';
import type { PopoverProps as RacPopoverProps } from 'react-aria-components/ComboBox';
import { Popover as RacPopover } from 'react-aria-components/ComboBox';
import { cx } from '../../../shared/utils/utils.js';
import { rootClassName } from '../../../theme/theme.js';
import type { XStyleProps } from '../../styles/xstyle.js';
import { resolveRacXStyleProps } from '../../styles/xstyle.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { resolveComboboxRecipeSlotStyles } from './recipe.js';

type _ComboboxPopoverOmit = DistributiveOmit<RacPopoverProps, 'UNSTABLE_portalContainer'>;
interface _ComboboxPopoverProps extends _ComboboxPopoverOmit, XStyleProps {
	/** Forwarded to the popover's DOM element. */
	ref?: Ref<HTMLElement>;
}

/** Props for the styled combobox popover. */
export type ComboboxPopoverProps = Prettify<_ComboboxPopoverProps>;

/**
 * Popover surface used for listbox content. The portal inherits the document's theme: importing a
 * theme stylesheet themes the whole document from `:root`, so no propagation is needed. A colour
 * mode scoped below `<html>` does not reach the portal.
 */
export function ComboboxPopover(props: ComboboxPopoverProps): JSX.Element {
	const { className, ref, style, xstyle, ...restProps } = props;
	const recipeStyles = resolveComboboxRecipeSlotStyles('popover');
	const racProps = resolveRacXStyleProps(recipeStyles, xstyle, className, style);

	return (
		<RacPopover
			{...restProps}
			{...racProps}
			// The portal renders outside the themed subtree, so it carries the theme root class
			// itself. It leads the class list because it sets inherited values the popover's own
			// styles then override, and it takes no part in the `xstyle` precedence chain.
			className={(renderProps) => cx(rootClassName, racProps.className(renderProps))}
			ref={ref}
		/>
	);
}

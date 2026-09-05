import { mergeProps } from '@react-aria/utils';
import type { JSX } from 'react';
import type {
	ListBoxItemProps as RacListBoxItemProps,
	ListBoxLoadMoreItemProps as RacListBoxLoadMoreItemProps,
} from 'react-aria-components/ComboBox';
import {
	ListBoxItem as RacListBoxItem,
	ListBoxLoadMoreItem as RacListBoxLoadMoreItem,
} from 'react-aria-components/ComboBox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { IconSizeProvider } from '../../icon/icon-size-context.js';
import { Icon } from '../../icon/icon.js';
import { COMBOBOX_CHECK_ICON_SIZE } from '../../sizing/combobox-sizing.js';
import { FIELD_CONTROL_ICON_SIZE } from '../../sizing/control-size.js';
import { resolveRecipeSlotProps } from '../../styles/recipe-authoring.js';
import type { XStyleProps } from '../../styles/xstyle.js';
import { composeRacRecipeProps } from '../../styles/xstyle.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import type { ComboboxSize } from './recipe.js';
import { comboboxRecipe } from './recipe.js';
import { useComboboxSize } from './size-context.js';

type _ComboboxItemOmit<T extends object> = DistributiveOmit<RacListBoxItemProps<T>, 'className'>;

interface _ComboboxItemProps<T extends object> extends _ComboboxItemOmit<T>, XStyleProps {
	className?: RacListBoxItemProps<T>['className'];
	size?: ComboboxSize;
}

/** Props for a combobox list item. */
export type ComboboxItemProps<T extends object> = Prettify<_ComboboxItemProps<T>>;

export function ComboboxItem<T extends object>(props: ComboboxItemProps<T>): JSX.Element {
	const { size: sizeProp, style, xstyle, ...itemProps } = props;
	const size = useComboboxSize(sizeProp);
	const recipeProps = resolveRecipeSlotProps(comboboxRecipe, 'item', { size }, xstyle);

	return (
		<RacListBoxItem
			// The children wrapper below is a render function, which disables RAC's
			// own string-children textValue inference — so re-derive it here.
			textValue={typeof itemProps.children === 'string' ? itemProps.children : undefined}
			{...itemProps}
			{...composeRacRecipeProps(recipeProps, itemProps.className, style)}
		>
			{composeRenderProps(itemProps.children, (children, { isSelected }) => {
				// RAC renders item content outside this component's original tree.
				// Put the provider inside the item render function so the content receives the context.
				return (
					<IconSizeProvider size={FIELD_CONTROL_ICON_SIZE[size]}>
						{children}
						{isSelected ? (
							<Icon
								aria-hidden
								{...resolveRecipeSlotProps(comboboxRecipe, 'itemCheck')}
								name="check"
								size={COMBOBOX_CHECK_ICON_SIZE}
							/>
						) : null}
					</IconSizeProvider>
				);
			})}
		</RacListBoxItem>
	);
}

type _ComboboxLoadMoreItemOmit = DistributiveOmit<RacListBoxLoadMoreItemProps, 'className'>;
interface _ComboboxLoadMoreItemProps extends _ComboboxLoadMoreItemOmit, XStyleProps {
	className?: RacListBoxLoadMoreItemProps['className'];
	size?: ComboboxSize;
}

/** Props for the combobox load-more sentinel item. */
export type ComboboxLoadMoreItemProps = Prettify<_ComboboxLoadMoreItemProps>;

export function ComboboxLoadMoreItem(props: ComboboxLoadMoreItemProps): JSX.Element {
	const { className, size: sizeProp, style, xstyle, ...loadMoreItemProps } = props;
	const size = useComboboxSize(sizeProp);

	return (
		<RacListBoxLoadMoreItem
			{...loadMoreItemProps}
			{...mergeProps(resolveRecipeSlotProps(comboboxRecipe, 'loadMoreItem', { size }, xstyle), {
				className,
				style,
			})}
		/>
	);
}

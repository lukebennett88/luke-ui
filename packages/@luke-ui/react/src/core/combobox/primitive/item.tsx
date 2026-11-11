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
import { cx } from '../../../shared/utils/utils.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import type { ComboboxSize } from './root.js';
import { useComboboxSize } from './size-context.js';
import { comboboxItemClassName, comboboxRecipe } from './styles.css.js';

type _ComboboxItemOmit<T extends object> = DistributiveOmit<
	RacListBoxItemProps<T>,
	'className' | 'render'
>;

interface _ComboboxItemProps<T extends object> extends _ComboboxItemOmit<T> {
	className?: RacListBoxItemProps<T>['className'];
	size?: ComboboxSize;
}

/** Props for a combobox list item. */
export type ComboboxItemProps<T extends object> = Prettify<_ComboboxItemProps<T>>;

export function ComboboxItem<T extends object>(props: ComboboxItemProps<T>): JSX.Element {
	const { size: sizeProp, ...itemProps } = props;
	const size = useComboboxSize(sizeProp);

	return (
		<RacListBoxItem
			{...itemProps}
			className={composeRenderProps(itemProps.className, (className) => {
				return cx(comboboxItemClassName, comboboxRecipe({ size }).item({ className }));
			})}
		/>
	);
}

type _ComboboxLoadMoreItemOmit = DistributiveOmit<
	RacListBoxLoadMoreItemProps,
	'className' | 'render'
>;
interface _ComboboxLoadMoreItemProps extends _ComboboxLoadMoreItemOmit {
	className?: RacListBoxLoadMoreItemProps['className'];
	size?: ComboboxSize;
}

/** Props for the combobox load-more sentinel item. */
export type ComboboxLoadMoreItemProps = Prettify<_ComboboxLoadMoreItemProps>;

export function ComboboxLoadMoreItem(props: ComboboxLoadMoreItemProps): JSX.Element {
	const { size: sizeProp, ...loadMoreItemProps } = props;
	const size = useComboboxSize(sizeProp);

	return (
		<RacListBoxLoadMoreItem
			{...loadMoreItemProps}
			className={comboboxRecipe({ size }).loadMoreItem({ className: loadMoreItemProps.className })}
		/>
	);
}
